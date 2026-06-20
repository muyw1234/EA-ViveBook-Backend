import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { config } from './config/config';
import Logging from './library/Logging';
import { socketHandler } from './services/SocketHandler';
import { ensureGlobalChat } from './library/ChatUtils';
import { inicializarRetos } from './services/Retos';
import { createApp } from './app';

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
  const app = createApp();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  app.set('io', io);
  socketHandler(io);

  httpServer.listen(config.server.port, '0.0.0.0', () => {
    Logging.info(`Server is running on port ${config.server.port}`);
    Logging.info(`Access Swagger at http://localhost:${config.server.port}/swagger`);
  });
};
