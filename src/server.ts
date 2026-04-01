import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import { config } from './config/config';
import Logging from './library/Logging';
import usuarioRoutes from './routes/Usuario';
import libreriaRoutes from './routes/Libreria';
import libroRoutes from './routes/Libro';
import autorRoutes from './routes/Autor';
import eventoRoutes from './routes/Evento';
import chatRoutes from './routes/Chat';
import mensajeRoutes from './routes/Mensaje';
import authRoutes from './routes/auth';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

const router = express();

/** Connect to Mongo */
mongoose
    .connect(config.mongo.url, { retryWrites: true, w: 'majority' })
    .then(() => {
        Logging.info('Mongo connected successfully.');
        StartServer();
    })
    .catch((error) => Logging.error(error));

/** Only Start Server if Mongoose Connects */
const StartServer = () => {
    /** Log the request */
    router.use((req, res, next) => {
        Logging.info(`Incomming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`);

        res.on('finish', () => {
            Logging.info(`Result - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - STATUS: [${res.statusCode}]`);
        });

        next();
    });

    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    /** Rules of our API */
    router.use(cors());

    /** Swagger */
    router.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    /** Routes */
    router.use('/usuarios', usuarioRoutes);
    router.use('/librerias', libreriaRoutes);
    router.use('/libros', libroRoutes);
    router.use('/autores', autorRoutes);
    router.use('/eventos', eventoRoutes);
    router.use('/chats', chatRoutes);
    router.use('/mensajes', mensajeRoutes);
    router.use('/auth', authRoutes);

    /** Healthcheck */
    router.get('/ping', (req, res, next) => res.status(200).json({ hello: 'world' }));

    /** Error handling */
    router.use((req, res, next) => {
        const error = new Error('Not found');

        Logging.error(error);

        res.status(404).json({
            message: error.message
        });
    });

    http.createServer(router).listen(config.server.port, () => {
        Logging.info(`Server is running on port ${config.server.port}`);
        Logging.info(`Access Swagger at http://localhost:${config.server.port}/swagger`);
    });
};
