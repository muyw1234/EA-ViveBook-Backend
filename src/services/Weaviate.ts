import axios, { AxiosError } from 'axios';
import { config } from '../config/config';
import Logging from '../library/Logging';
import { ILibro } from '../models/Libro';

const LIBRO_CLASS_NAME = 'LibroRecommendation';

export interface LibroVectorRecord {
  libroId: string;
  isbn?: string;
  title: string;
  autor?: string;
  categoria?: string;
  type?: string;
  precio?: number;
  estado?: string;
  owner?: string;
  IsDeleted?: boolean;
  imageUrl?: string;
  text: string;
}

export interface LibroVectorSearchResult extends LibroVectorRecord {
  weaviateId: string;
  distance?: number;
  certainty?: number;
}

export interface IndexLibroInput extends Partial<ILibro> {
  _id?: unknown;
}

const client = axios.create({
  baseURL: config.weaviate.url,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getAxiosErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    return (
      axiosError.response?.data?.error?.[0]?.message ||
      axiosError.response?.data?.message ||
      axiosError.message
    );
  }

  if (error instanceof Error) return error.message;

  return String(error);
}

function graphQLString(value: string): string {
  return JSON.stringify(value);
}

function getLibroId(libro: IndexLibroInput): string {
  const rawId = libro._id || (libro as any).id;

  if (!rawId) {
    throw new Error('No se puede indexar un libro sin identificador');
  }

  return rawId.toString();
}

function normalizeObjectId(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && '_id' in (value as any)) return (value as any)._id?.toString();
  return value.toString();
}

function authorsToText(libro: IndexLibroInput): string | undefined {
  if (libro.autor) return libro.autor;
  if (!libro.authors || !Array.isArray(libro.authors)) return undefined;

  return libro.authors
    .map((author: unknown) => {
      if (typeof author === 'string') return author;
      if (typeof author === 'object' && author && 'fullName' in (author as any))
        return (author as any).fullName;
      if (typeof author === 'object' && author && '_id' in (author as any))
        return (author as any)._id?.toString();
      return String(author);
    })
    .filter(Boolean)
    .join(', ');
}

export function buildLibroText(libro: IndexLibroInput): string {
  const autor = authorsToText(libro) || 'Autor no especificado';
  const categoria = libro.categoria || 'Categoría no especificada';
  const type = libro.type || 'Tipo no especificado';
  const precio = typeof libro.precio === 'number' ? `${libro.precio}` : 'Precio no especificado';
  const estado = libro.estado || 'Estado no especificado';

  return [
    `Título: ${libro.title || 'Sin título'}`,
    `ISBN: ${libro.isbn || 'Sin ISBN'}`,
    `Autor: ${autor}`,
    `Categoría: ${categoria}`,
    `Tipo: ${type}`,
    `Precio: ${precio}`,
    `Estado: ${estado}`,
  ].join('\n');
}

function mapLibroToVectorRecord(libro: IndexLibroInput): LibroVectorRecord {
  return {
    libroId: getLibroId(libro),
    isbn: libro.isbn,
    title: libro.title || 'Sin título',
    autor: authorsToText(libro),
    categoria: libro.categoria,
    type: libro.type,
    precio: libro.precio,
    estado: libro.estado,
    owner: normalizeObjectId(libro.owner),
    IsDeleted: libro.IsDeleted || false,
    imageUrl: libro.imageUrl,
    text: buildLibroText(libro),
  };
}

export async function checkWeaviateConnection(): Promise<boolean> {
  try {
    await client.get('/v1/.well-known/ready');
    return true;
  } catch (error) {
    Logging.error(`Weaviate no está disponible: ${getAxiosErrorMessage(error)}`);
    return false;
  }
}

export async function ensureLibroSchema(): Promise<void> {
  try {
    await client.get(`/v1/schema/${LIBRO_CLASS_NAME}`);
    return;
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 404) {
      throw new Error(
        `No se pudo comprobar el esquema de Weaviate: ${getAxiosErrorMessage(error)}`,
      );
    }
  }

  await client.post('/v1/schema', {
    class: LIBRO_CLASS_NAME,
    description: 'Libros indexados para recomendaciones semánticas',
    vectorizer: 'none',
    properties: [
      { name: 'libroId', dataType: ['text'], description: 'ID del libro en MongoDB' },
      { name: 'isbn', dataType: ['text'] },
      { name: 'title', dataType: ['text'] },
      { name: 'autor', dataType: ['text'] },
      { name: 'categoria', dataType: ['text'] },
      { name: 'type', dataType: ['text'] },
      { name: 'precio', dataType: ['number'] },
      { name: 'estado', dataType: ['text'] },
      { name: 'owner', dataType: ['text'] },
      { name: 'IsDeleted', dataType: ['boolean'] },
      { name: 'imageUrl', dataType: ['text'] },
      { name: 'text', dataType: ['text'], description: 'Texto usado para calcular el embedding' },
    ],
  });

  Logging.info(`Esquema ${LIBRO_CLASS_NAME} creado en Weaviate`);
}

export async function findLibroObjectByMongoId(
  libroId: string,
): Promise<LibroVectorSearchResult | null> {
  const query = `
        {
            Get {
                ${LIBRO_CLASS_NAME}(
                    where: {
                        path: ["libroId"],
                        operator: Equal,
                        valueText: ${graphQLString(libroId)}
                    },
                    limit: 1
                ) {
                    libroId
                    isbn
                    title
                    autor
                    categoria
                    type
                    precio
                    estado
                    owner
                    IsDeleted
                    imageUrl
                    text
                    _additional {
                        id
                    }
                }
            }
        }
    `;

  const response = await client.post('/v1/graphql', { query });
  const result = response.data?.data?.Get?.[LIBRO_CLASS_NAME]?.[0];

  if (!result) return null;

  return {
    ...result,
    weaviateId: result._additional.id,
  };
}

export async function upsertLibro(
  libro: IndexLibroInput,
  vector: number[],
): Promise<LibroVectorSearchResult> {
  await ensureLibroSchema();

  const properties = mapLibroToVectorRecord(libro);
  const existingObject = await findLibroObjectByMongoId(properties.libroId);

  if (existingObject) {
    await client.put(`/v1/objects/${LIBRO_CLASS_NAME}/${existingObject.weaviateId}`, {
      class: LIBRO_CLASS_NAME,
      properties,
      vector,
    });

    return {
      ...properties,
      weaviateId: existingObject.weaviateId,
    };
  }

  const response = await client.post('/v1/objects', {
    class: LIBRO_CLASS_NAME,
    properties,
    vector,
  });

  return {
    ...properties,
    weaviateId: response.data.id,
  };
}

export async function deleteLibro(libroId: string): Promise<void> {
  const existingObject = await findLibroObjectByMongoId(libroId);
  if (!existingObject) return;

  await client.delete(`/v1/objects/${LIBRO_CLASS_NAME}/${existingObject.weaviateId}`);
}

export async function searchLibrosByVector(
  vector: number[],
  limit = 5,
  includeDeleted = false,
): Promise<LibroVectorSearchResult[]> {
  await ensureLibroSchema();

  const whereClause = includeDeleted
    ? ''
    : `
            where: {
                path: ["IsDeleted"],
                operator: Equal,
                valueBoolean: false
            },
        `;

  const query = `
        {
            Get {
                ${LIBRO_CLASS_NAME}(
                    ${whereClause}
                    nearVector: {
                        vector: [${vector.join(',')}]
                    },
                    limit: ${limit}
                ) {
                    libroId
                    isbn
                    title
                    autor
                    categoria
                    type
                    precio
                    estado
                    owner
                    IsDeleted
                    imageUrl
                    text
                    _additional {
                        id
                        distance
                        certainty
                    }
                }
            }
        }
    `;

  const response = await client.post('/v1/graphql', { query });
  const results = response.data?.data?.Get?.[LIBRO_CLASS_NAME] || [];

  return results.map((result: any) => ({
    ...result,
    weaviateId: result._additional.id,
    distance: result._additional.distance,
    certainty: result._additional.certainty,
  }));
}

export default {
  checkWeaviateConnection,
  ensureLibroSchema,
  buildLibroText,
  findLibroObjectByMongoId,
  upsertLibro,
  deleteLibro,
  searchLibrosByVector,
};
