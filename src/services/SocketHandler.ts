import { Server, Socket } from 'socket.io';
import Mensaje from '../models/Mensaje';
import Chat from '../models/Chat';
import Logging from '../library/Logging';
import mongoose from 'mongoose';

export const socketHandler = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        Logging.info(`User connected: ${socket.id}`);

        socket.on('register_user', (userId: string) => {
            socket.data.userId = userId;
            socket.join(userId);
            Logging.info(`Socket ${socket.id} joined private room: ${userId}`);
        });

        socket.on('join_chat', (chatId: string) => {
            socket.join(chatId);
            socket.data.currentChat = chatId;
            Logging.info(`User ${socket.id} joined chat: ${chatId}`);
        });

        socket.on('joinChat', (chatId: string) => {
            socket.join(chatId);
            socket.data.currentChat = chatId;
            Logging.info(`User ${socket.id} joined chat (camel): ${chatId}`);
        });

        socket.on('leave_chat', (chatId: string) => {
            socket.leave(chatId);
            socket.data.currentChat = null;
            Logging.info(`User ${socket.id} left chat: ${chatId}`);
        });

        socket.on('leaveChat', (chatId: string) => {
            socket.leave(chatId);
            socket.data.currentChat = null;
            Logging.info(`User ${socket.id} left chat (camel): ${chatId}`);
        });

        const handleSendMessage = async (data: { chatId: string, senderId: string, content: string }) => {
            const { chatId, senderId, content } = data;

            try {
                // Find chat to see participants
                const chat = await Chat.findById(chatId);
                const readBy: string[] = [senderId];

                if (chat) {
                    // Find all sockets in the chatId room to check who is active
                    const sockets = await io.in(chatId).fetchSockets();
                    const activeUserIds = sockets.map(s => s.data.userId).filter(Boolean);

                    for (const participant of chat.participants) {
                        const pStr = participant.toString();
                        if (activeUserIds.includes(pStr) && !readBy.includes(pStr)) {
                            readBy.push(pStr);
                        }
                    }
                }

                const nuevoMensaje = new Mensaje({
                    _id: new mongoose.Types.ObjectId(),
                    chat: chatId,
                    sender: senderId,
                    content: content,
                    timestamp: new Date(),
                    readBy: readBy
                });

                const mensajeGuardado = await nuevoMensaje.save();
                await mensajeGuardado.populate('sender');

                io.to(chatId).emit('receive_message', mensajeGuardado);
                io.to(chatId).emit('receiveMessage', mensajeGuardado);
                Logging.info(`Message sent in chat ${chatId} by ${senderId}`);

                // Notify other participants who are NOT currently viewing this chat (currentChat !== chatId)
                if (chat) {
                    const otherParticipants = chat.participants.filter(p => p.toString() !== senderId);
                    for (const participant of otherParticipants) {
                        const pStr = participant.toString();
                        // Find if participant is online
                        const userSockets = await io.in(pStr).fetchSockets();
                        const isViewingChat = userSockets.some(s => s.data.currentChat === chatId);
                        
                        if (!isViewingChat) {
                            io.to(pStr).emit('newChatNotification', {
                                chat,
                                message: mensajeGuardado
                            });
                        }
                    }
                }
            } catch (error) {
                Logging.error(`Error saving message: ${error}`);
                socket.emit('error', { message: 'No se pudo enviar el mensaje' });
            }
        };

        socket.on('send_message', handleSendMessage);
        socket.on('sendMessage', handleSendMessage);

        socket.on('disconnect', () => {
            Logging.info(`User disconnected: ${socket.id}`);
        });
    });
};
