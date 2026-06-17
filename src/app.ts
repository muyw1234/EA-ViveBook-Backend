import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
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
import adminAutorRoutes from './routes/admin/Autor';
import adminLibroRoutes from './routes/admin/Libro';
import adminUsuarioRoutes from './routes/admin/Usuario';
import adminLibreriaRoutes from './routes/admin/Libreria';
import adminPostRoutes from './routes/admin/Post';
import adminEventoRoutes from './routes/admin/Evento';
import adminValoracionRoutes from './routes/admin/Valoracion';
import adminReservaRoutes from './routes/admin/Reserva';
import adminRetoRoutes from './routes/admin/Reto';
import { swaggerSpec } from './swagger';

export const createApp = () => {
  const app = express();

  app.use(pinoHttp({ logger: Logging.logger }));

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(cors());

  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/usuarios', usuarioRoutes);
  app.use('/librerias', libreriaRoutes);
  app.use('/libros', libroRoutes);
  app.use('/autores', autorRoutes);
  app.use('/eventos', eventoRoutes);
  app.use('/chats', chatRoutes);
  app.use('/mensajes', mensajeRoutes);
  app.use('/auth', authRoutes);
  app.use('/posts', postRoutes);
  app.use('/valoraciones', valoracionRoutes);
  app.use('/image', imageRoutes);
  app.use('/matomo', matomoRoute);
  app.use('/retos', retosRoutes);
  app.use('/reservas', reservaRoutes);
  app.use('/message-requests', messageRequestRoutes);
  app.use('/recomendaciones', recomendacionRoutes);
  app.use('/admin/autores', adminAutorRoutes);
  app.use('/admin/libros', adminLibroRoutes);
  app.use('/admin/usuarios', adminUsuarioRoutes);
  app.use('/admin/librerias', adminLibreriaRoutes);
  app.use('/admin/posts', adminPostRoutes);
  app.use('/admin/eventos', adminEventoRoutes);
  app.use('/admin/valoraciones', adminValoracionRoutes);
  app.use('/admin/reservas', adminReservaRoutes);
  app.use('/admin/retos', adminRetoRoutes);

  app.get('/ping', (req, res) => res.status(200).json({ hello: 'world' }));

  app.use((req, res) => {
    const error = new Error('Not found');

    Logging.error(error);

    res.status(404).json({
      message: error.message,
    });
  });

  return app;
};
