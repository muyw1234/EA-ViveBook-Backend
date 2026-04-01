import swaggerJSDoc, { Options } from 'swagger-jsdoc';
import path from 'path';
import { config } from './config/config';

const options: Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API interno de Vivebook',
            version: '1.0.0',
            description: 'API REST interno'
        },
        servers: [
            {
                url: `http://localhost:${config.server.port}`
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },

    // IMPORTANTE: leer los .js compilados en build/routes
    apis: [path.join(__dirname, 'routes', '*.js')]
};

export const swaggerSpec = swaggerJSDoc(options);
