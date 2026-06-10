import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import pinoHttp from 'pino-http';
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
import postRoutes from './routes/Post';
import matomoRoute from './routes/Matomo';
import valoracionRoutes from './routes/Valoracion';
import imageRoutes from './routes/Image';
import retosRoutes from './routes/Retos';
import reservaRoutes from './routes/Reserva';
import messageRequestRoutes from './routes/MessageRequest';
import recomendacionRoutes from './routes/Recomendacion';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { socketHandler } from './services/SocketHandler';
import { ensureGlobalChat } from './library/ChatUtils';
import { inicializarRetos } from './services/Retos';

const router = express();

mongoose
  .connect(config.mongo.url, { retryWrites: true, w: 'majority' })
  .then(async () => {
    Logging.info('Mongo connected successfully.');
    await inicializarRetos();
    Logging.info('Retos inicializados correctamente.');
    ensureGlobalChat();
    StartServer();
  })
  .catch((error) => Logging.error(error));

const StartServer = () => {
  router.use(pinoHttp({ logger: Logging.logger }));

  router.use(express.urlencoded({ extended: true }));
  router.use(express.json());

  router.use(cors());

  router.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  router.use('/usuarios', usuarioRoutes);
  router.use('/librerias', libreriaRoutes);
  router.use('/libros', libroRoutes);
  router.use('/autores', autorRoutes);
  router.use('/eventos', eventoRoutes);
  router.use('/chats', chatRoutes);
  router.use('/mensajes', mensajeRoutes);
  router.use('/auth', authRoutes);
  router.use('/posts', postRoutes);
  router.use('/valoraciones', valoracionRoutes);
  router.use('/image', imageRoutes);
  router.use('/matomo', matomoRoute);
  router.use('/retos', retosRoutes);
  router.use('/reservas', reservaRoutes);
  router.use('/message-requests', messageRequestRoutes);
  router.use('/recomendaciones', recomendacionRoutes);

  router.get('/ping', (req, res, next) => res.status(200).json({ hello: 'world' }));

  router.use((req, res, next) => {
    const error = new Error('Not found');

    Logging.error(error);

    res.status(404).json({
      message: error.message,
    });
  });

  const httpServer = http.createServer(router);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  router.set('io', io);
  socketHandler(io);

  httpServer.listen(config.server.port, () => {
    Logging.info(`Server is running on port ${config.server.port}`);
    Logging.info(`Access Swagger at http://localhost:${config.server.port}/swagger`);
  });
};
