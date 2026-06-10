import AIService, { GenerateTextResult, RecommendationContextItem } from './AI';
import WeaviateService, { LibroVectorSearchResult } from './Weaviate';
import Libro from '../models/Libro';
import Logging from '../library/Logging';

export interface RecomendacionInput {
  query: string;
  limit?: number;
  includeDeleted?: boolean;
  context?: Array<string | RecommendationContextItem>;
}

export interface RecomendacionResult {
  query: string;
  respuesta: string;
  context: RecommendationContextItem[];
  metadata: {
    model: string;
    contextSource: 'request' | 'mongodb';
    totalContextItems: number;
  };
}

export interface SyncLibrosResult {
  total: number;
  indexed: number;
  failed: number;
  errors: Array<{
    libroId: string;
    title?: string;
    error: string;
  }>;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeRequestContext(
  context: Array<string | RecommendationContextItem> = [],
): RecommendationContextItem[] {
  return context
    .map((item) => {
      if (typeof item === 'string') {
        return {
          text: item.trim(),
        };
      }

      return {
        title: item.title,
        text: item.text?.trim(),
      };
    })
    .filter((item) => item.text && item.text.length > 0);
}

function libroToContextItem(libro: any): RecommendationContextItem {
  return {
    title: libro.title,
    text: [
      `Título: ${libro.title || 'Sin título'}`,
      `Autor: ${libro.autor || (Array.isArray(libro.authors) ? libro.authors.map((author: any) => author.fullName || author.toString()).join(', ') : 'Autor no especificado')}`,
      `Categoría: ${libro.categoria || 'Categoría no especificada'}`,
      `Tipo: ${libro.type || 'Tipo no especificado'}`,
      `Precio: ${typeof libro.precio === 'number' ? libro.precio : 'Precio no especificado'}`,
      `Estado: ${libro.estado || 'Estado no especificado'}`,
      `ID: ${libro._id.toString()}`,
    ].join('\n'),
  };
}

async function searchMongoContext(
  query: string,
  limit: number,
  includeDeleted: boolean,
): Promise<RecommendationContextItem[]> {
  const search = escapeRegex(query);
  const filter: any = {
    $or: [
      { title: { $regex: search, $options: 'i' } },
      { autor: { $regex: search, $options: 'i' } },
      { categoria: { $regex: search, $options: 'i' } },
      { isbn: { $regex: search, $options: 'i' } },
      { type: { $regex: search, $options: 'i' } },
      { estado: { $regex: search, $options: 'i' } },
    ],
  };

  if (!includeDeleted) {
    filter.IsDeleted = false;
  }

  let libros = await Libro.find(filter).limit(limit).populate('authors', 'fullName');

  if (libros.length === 0) {
    const fallbackFilter = includeDeleted ? {} : { IsDeleted: false };
    libros = await Libro.find(fallbackFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('authors', 'fullName');
  }

  return libros.map(libroToContextItem);
}

export async function recomendarLibros(input: RecomendacionInput): Promise<RecomendacionResult> {
  const query = input.query.trim();
  const limit = input.limit || 5;
  const includeDeleted = input.includeDeleted || false;

  if (!query) {
    throw new Error('La consulta de recomendación no puede estar vacía');
  }

  const requestContext = normalizeRequestContext(input.context);
  const contextSource = requestContext.length > 0 ? 'request' : 'mongodb';
  const contextItems =
    requestContext.length > 0
      ? requestContext
      : await searchMongoContext(query, limit, includeDeleted);
  const generation: GenerateTextResult = await AIService.generateRecommendation(
    query,
    contextItems,
  );

  return {
    query,
    respuesta: generation.response,
    context: contextItems,
    metadata: {
      model: generation.model,
      contextSource,
      totalContextItems: contextItems.length,
    },
  };
}

export async function syncLibrosToWeaviate(): Promise<SyncLibrosResult> {
  await WeaviateService.ensureLibroSchema();

  const libros = await Libro.find().populate('authors', 'fullName');
  const result: SyncLibrosResult = {
    total: libros.length,
    indexed: 0,
    failed: 0,
    errors: [],
  };

  for (const libro of libros) {
    const libroId = libro._id.toString();

    try {
      const text = WeaviateService.buildLibroText(libro);
      const vector = await AIService.generateEmbedding(text);
      await WeaviateService.upsertLibro(libro, vector);

      result.indexed += 1;
      Logging.info(`Libro ${libroId} indexado en Weaviate`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      result.failed += 1;
      result.errors.push({
        libroId,
        title: libro.title,
        error: message,
      });

      Logging.error(`No se pudo indexar el libro ${libroId} en Weaviate: ${message}`);
    }
  }

  return result;
}

export async function healthCheck(): Promise<{
  ai: boolean;
  weaviate?: boolean;
}> {
  return {
    ai: await AIService.checkAIConnection(),
  };
}

export default {
  recomendarLibros,
  syncLibrosToWeaviate,
  healthCheck,
};
