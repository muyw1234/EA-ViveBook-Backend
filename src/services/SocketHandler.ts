import { Server, Socket } from 'socket.io';
import Mensaje from '../models/Mensaje';
import Logging from '../library/Logging';
import mongoose from 'mongoose';

export const socketHandler = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    Logging.info(`User connected: ${socket.id}`);

    socket.on('join_chat', (chatId: string) => {
      socket.join(chatId);
      Logging.info(`User ${socket.id} joined chat: ${chatId}`);
    });

    socket.on(
      'send_message',
      async (data: { chatId: string; senderId: string; content: string }) => {
        const { chatId, senderId, content } = data;

        try {
          const nuevoMensaje = new Mensaje({
            _id: new mongoose.Types.ObjectId(),
            chat: chatId,
            sender: senderId,
            content: content,
            timestamp: new Date(),
          });

          const mensajeGuardado = await nuevoMensaje.save();
          // Opcional: Popular el sender para que el frontend tenga info del usuario
          await mensajeGuardado.populate('sender');

          io.to(chatId).emit('receive_message', mensajeGuardado);
          Logging.info(`Message sent in chat ${chatId} by ${senderId}`);
        } catch (error) {
          Logging.error(`Error saving message: ${error}`);
          socket.emit('error', { message: 'No se pudo enviar el mensaje' });
        }
      },
    );

    socket.on('disconnect', () => {
      Logging.info(`User disconnected: ${socket.id}`);
    });
  });
};
