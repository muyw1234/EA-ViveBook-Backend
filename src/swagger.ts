import swaggerJSDoc, { Options } from 'swagger-jsdoc';
import path from 'path';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API interno de Vivebook',
      version: '1.0.0',
      description: 'API REST interno',
    },
    servers: [
      {
        url: '/',
        description: 'Servidor actual',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Pagination: {
          type: 'object',
          required: ['total', 'page', 'limit', 'totalPages'],
          properties: {
            total: { type: 'integer', example: 42 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        ApiError: {
          type: 'object',
          required: ['success', 'status', 'message', 'code', 'errors'],
          properties: {
            success: { type: 'boolean', example: false },
            status: { type: 'integer', example: 404 },
            message: { type: 'string', example: 'Recurso no encontrado' },
            code: {
              type: 'string',
              enum: [
                'BAD_REQUEST',
                'UNAUTHORIZED',
                'FORBIDDEN',
                'NOT_FOUND',
                'CONFLICT',
                'VALIDATION_ERROR',
                'INTERNAL_ERROR',
              ],
              example: 'NOT_FOUND',
            },
            errors: { nullable: true },
          },
        },
        ValidationError: {
          allOf: [{ $ref: '#/components/schemas/ApiError' }],
        },
      },
      responses: {
        Unauthorized: {
          description: 'JWT ausente, inválido o expirado.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        Forbidden: {
          description: 'El usuario autenticado no tiene rol Admin.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        NotFound: {
          description: 'El recurso solicitado no existe.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        BadRequest: {
          description: 'La petición contiene datos o identificadores no válidos.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        ValidationFailed: {
          description: 'El cuerpo de la petición no supera la validación Joi.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' },
            },
          },
        },
        Conflict: {
          description: 'Conflicto con datos únicos existentes.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        InternalError: {
          description: 'Error interno del servidor.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
    },
  },

  // Incluye tanto rutas públicas como rutas administrativas en subdirectorios.
  apis: [path.join(__dirname, 'routes', '**', '*.js')],
};

type SwaggerDocument = Record<string, unknown> & {
  paths?: Record<string, Record<string, unknown>>;
};

const generatedSpec = swaggerJSDoc(options) as SwaggerDocument;
const adminPaths = generatedSpec.paths ?? {};

for (const [pathName, pathItem] of Object.entries(adminPaths)) {
  if (!pathName.startsWith('/admin/') || !pathItem || typeof pathItem !== 'object') continue;

  for (const [method, operation] of Object.entries(pathItem)) {
    if (!operation || typeof operation !== 'object' || !('responses' in operation)) continue;
    const responses = operation.responses as Record<string, unknown>;
    responses['400'] ??= { $ref: '#/components/responses/BadRequest' };
    responses['401'] ??= { $ref: '#/components/responses/Unauthorized' };
    responses['403'] ??= { $ref: '#/components/responses/Forbidden' };
    responses['500'] ??= { $ref: '#/components/responses/InternalError' };
    if (pathName.includes('{')) {
      responses['404'] ??= { $ref: '#/components/responses/NotFound' };
    }
    if (['post', 'put', 'patch'].includes(method)) {
      responses['409'] ??= { $ref: '#/components/responses/Conflict' };
    }
    if ('requestBody' in operation) {
      responses['422'] ??= { $ref: '#/components/responses/ValidationFailed' };
    }
  }
}

export const swaggerSpec = generatedSpec;
