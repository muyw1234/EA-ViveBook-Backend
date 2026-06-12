import swaggerJSDoc, { Options } from 'swagger-jsdoc';
import path from 'path';
import { config } from './config/config';

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
        url: `http://${config.server.swaggerUrl}:${config.server.swaggerPort}`,
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
          required: ['success', 'status', 'message'],
          properties: {
            success: { type: 'boolean', example: false },
            status: { type: 'integer', example: 404 },
            message: { type: 'string', example: 'Recurso no encontrado' },
            errors: { nullable: true },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              description: 'Detalle devuelto por Joi.',
            },
          },
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

export const swaggerSpec = swaggerJSDoc(options);
