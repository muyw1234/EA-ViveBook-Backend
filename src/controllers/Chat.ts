import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Chat from '../models/Chat';
import Mensaje from '../models/Mensaje';
import { sendSuccess, sendError } from '../library/ApiResponse';
import Logging from '../library/Logging';

const createChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const chat = new Chat({
            _id: new mongoose.Types.ObjectId(),
            ...req.body
        });
        const savedChat = await chat.save();
        return sendSuccess(res, savedChat, 'Chat creado con éxito', 201);
    } catch (error) {
        return sendError(res, error, 'No se pudo crear el chat');
    }
};

const getChat = async (req: Request, res: Response, next: NextFunction) => {
    const chatId = req.params.chatId;
    try {
        const chat = await Chat.findById(chatId).populate('participants libro');
        if (!chat) {
            return sendError(res, 'El chat solicitado no existe', 'Not Found', 404);
        }
        return sendSuccess(res, chat, 'Chat obtenido con éxito');
    } catch (error) {
        return sendError(res, error, 'Error al procesar la búsqueda del chat');
    }
};

const getAllChats = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    if (!userId) {
        return sendError(res, 'No autorizado', 'Unauthorized', 401);
    }
    try {
        // Return only chats where current user is a participant and not global chat
        const chats = await Chat.find({
            participants: userId,
            _id: { $ne: '000000000000000000000001' }
        }).populate('participants libro');
        return sendSuccess(res, chats, 'Listado de chats obtenido con éxito');
    } catch (error) {
        return sendError(res, error, 'Error al recuperar la lista de chats');
    }
};

const deleteChat = async (req: Request, res: Response, next: NextFunction) => {
    const chatId = req.params.chatId;
    try {
        const chat = await Chat.findByIdAndDelete(chatId);
        if (!chat) {
            return sendError(res, 'No encontró el chat para eliminar', 'Not Found', 404);
        }
        return sendSuccess(res, chat, 'Chat eliminado permanentemente de la base de datos');
    } catch (error) {
        return sendError(res, error, 'Error al intentar eliminar el chat');
    }
};

const getChatMessages = async (req: Request, res: Response, next: NextFunction) => {
    const chatId = req.params.id;
    const userId = req.userId;
    if (!userId) {
        return sendError(res, 'No autorizado', 'Unauthorized', 401);
    }
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return sendError(res, 'El chat no existe', 'Not Found', 404);
        }
        // Validate participant
        if (!chat.participants.map(p => p.toString()).includes(userId)) {
            return sendError(res, 'No tienes permiso para ver este chat', 'Forbidden', 403);
        }
        const mensajes = await Mensaje.find({ chat: chatId }).populate('sender');
        return sendSuccess(res, mensajes, 'Mensajes recuperados con éxito');
    } catch (error) {
        return sendError(res, error, 'Error al recuperar los mensajes');
    }
};

const sendChatMessage = async (req: Request, res: Response, next: NextFunction) => {
    const chatId = req.params.id;
    const userId = req.userId;
    const { content } = req.body;

    if (!userId) {
        return sendError(res, 'No autorizado', 'Unauthorized', 401);
    }
    if (!content) {
        return sendError(res, 'El contenido no puede estar vacío', 'Bad Request', 400);
    }

    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return sendError(res, 'El chat no existe', 'Not Found', 404);
        }
        // Validate participant
        if (!chat.participants.map(p => p.toString()).includes(userId)) {
            return sendError(res, 'No tienes permiso para enviar mensajes a este chat', 'Forbidden', 403);
        }

        const nuevoMensaje = new Mensaje({
            _id: new mongoose.Types.ObjectId(),
            chat: chatId,
            sender: userId,
            content,
            timestamp: new Date()
        });

        const messageSaved = await nuevoMensaje.save();
        await messageSaved.populate('sender');

        // WebSocket emit in real-time
        const io = req.app.get('io');
        if (io) {
            io.to(chatId).emit('receive_message', messageSaved);
            
            const otherParticipants = chat.participants.filter(p => p.toString() !== userId);
            for (const p of otherParticipants) {
                io.to(p.toString()).emit('newChatNotification', {
                    chat,
                    message: messageSaved
                });
            }
        }

        return sendSuccess(res, messageSaved, 'Mensaje enviado con éxito', 201);
    } catch (error) {
        return sendError(res, error, 'Error al enviar el mensaje');
    }
};

const markChatAsRead = async (req: Request, res: Response, next: NextFunction) => {
    const chatId = req.params.id;
    const userId = req.userId;
    if (!userId) {
        return sendError(res, 'No autorizado', 'Unauthorized', 401);
    }

    try {
        await Mensaje.updateMany(
            {
                chat: chatId,
                sender: { $ne: userId },
                readBy: { $ne: userId }
            },
            {
                $addToSet: { readBy: userId }
            }
        );
        return sendSuccess(res, null, 'Mensajes del chat marcados como leídos');
    } catch (error) {
        return sendError(res, error, 'Error al marcar mensajes como leídos');
    }
};

export default {
    createChat,
    getChat,
    getAllChats,
    deleteChat,
    getChatMessages,
    sendChatMessage,
    markChatAsRead
};
