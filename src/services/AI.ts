import axios, { AxiosError } from 'axios';
import { config } from '../config/config';
import Logging from '../library/Logging';

export interface GenerateTextOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface GenerateTextResult {
    model: string;
    response: string;
    done: boolean;
    raw?: unknown;
}

export interface EmbeddingOptions {
    model?: string;
}

export interface RecommendationContextItem {
    title?: string;
    text: string;
}

const client = axios.create({
    baseURL: config.ai.baseUrl,
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json'
    }
});

function getAxiosErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        return axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message;
    }

    if (error instanceof Error) return error.message;

    return String(error);
}

function extractEmbedding(data: any): number[] {
    if (Array.isArray(data?.embedding)) return data.embedding;
    if (Array.isArray(data?.embeddings?.[0])) return data.embeddings[0];

    throw new Error('La respuesta del servicio de embeddings no contiene un vector válido');
}

export async function checkAIConnection(): Promise<boolean> {
    try {
        await client.get('/api/tags');
        return true;
    } catch (error) {
        Logging.error(`El servicio IA no está disponible: ${getAxiosErrorMessage(error)}`);
        return false;
    }
}

export async function generateText(prompt: string, options: GenerateTextOptions = {}): Promise<GenerateTextResult> {
    if (!prompt || prompt.trim().length === 0) {
        throw new Error('El prompt no puede estar vacío');
    }

    const model = options.model || config.ai.llmModel;

    try {
        const response = await client.post('/api/generate', {
            model,
            prompt,
            stream: false,
            options: {
                temperature: options.temperature ?? 0.3,
                num_predict: options.maxTokens
            }
        });

        return {
            model: response.data.model || model,
            response: response.data.response || '',
            done: Boolean(response.data.done),
            raw: response.data
        };
    } catch (error) {
        throw new Error(`No se pudo generar la respuesta del LLM: ${getAxiosErrorMessage(error)}`);
    }
}

export async function generateEmbedding(text: string, options: EmbeddingOptions = {}): Promise<number[]> {
    if (!text || text.trim().length === 0) {
        throw new Error('El texto para generar embeddings no puede estar vacío');
    }

    const model = options.model || config.ai.embeddingModel;

    try {
        const response = await client.post('/api/embed', {
            model,
            input: text
        });

        return extractEmbedding(response.data);
    } catch (error) {
        throw new Error(`No se pudo generar el embedding: ${getAxiosErrorMessage(error)}`);
    }
}

export function buildRecommendationPrompt(userQuery: string, contextItems: RecommendationContextItem[] = []): string {
    const context = contextItems.length
        ? contextItems
              .map((item, index) => {
                  return [`Contexto ${index + 1}${item.title ? ` - ${item.title}` : ''}:`, item.text].join('\n');
              })
              .join('\n\n')
        : 'No hay contexto adicional disponible.';

    return [
        'Eres un asistente de recomendaciones para una aplicación de compraventa y alquiler de libros.',
        'No tengas en cuenta conversaciones anteriores.',
        'Responde en español de forma clara y breve.',
        'Usa únicamente el contexto proporcionado para recomendar.',
        'Si el contexto no contiene información suficiente, indícalo de forma honesta.',
        '',
        `Petición del usuario: ${userQuery}`,
        '',
        'Contexto disponible:',
        context,
        '',
        'Devuelve una recomendación razonada e incluye el título y el motivo principal.'
    ].join('\n');
}

export async function generateRecommendation(userQuery: string, contextItems: RecommendationContextItem[] = [], options: GenerateTextOptions = {}): Promise<GenerateTextResult> {
    const prompt = buildRecommendationPrompt(userQuery, contextItems);
    return generateText(prompt, options);
}

export default {
    checkAIConnection,
    generateText,
    generateEmbedding,
    buildRecommendationPrompt,
    generateRecommendation
};
