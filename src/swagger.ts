import swaggerJSDoc, { Options } from 'swagger-jsdoc';
import path from 'path';
import { config } from './config/config';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EA Sem5 API',
      version: '1.0.0',
      description: 'API REST de Organizaciones y Usuarios',
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
      },
    ],
  },

  // IMPORTANTE: leer los .js compilados en build/routes
  apis: [path.join(__dirname, 'routes', '*.js')],
};

export const swaggerSpec = swaggerJSDoc(options);