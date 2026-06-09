import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Mensaje from '../models/Mensaje';
import Reserva from '../models/Reserva';
import Chat from '../models/Chat';
import Logging from '../library/Logging';
import { sendSuccess, sendError } from '../library/ApiResponse';

const createMensaje = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const mensaje = new Mensaje({
            _id: new mongoose.Types.ObjectId(),
            ...req.body
        });
        const savedMensaje = await mensaje.save();
        return sendSuccess(res, savedMensaje, 'Mensaje enviado con éxito', 201);
    } catch (error) {
        return sendError(res, error, 'No se pudo enviar el mensaje');
    }
};

const getMensajesByChat = async (req: Request, res: Response, next: NextFunction) => {
    const chatId = req.params.chatId;
    const userId = req.userId;
    try {
        const query: any = { chat: chatId, category: { $ne: 'reservation' } };
        if (userId) {
            query.deletedBy = { $ne: userId };
        }
        const mensajes = await Mensaje.find(query).populate('sender');
        return sendSuccess(res, mensajes, `Mensajes del chat recuperados con éxito`);
    } catch (error) {
        return sendError(res, error, 'Error al recuperar los mensajes del chat');
    }
};

const getReservasMensajes = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    try {
        const userReservations = await Reserva.find({
            $or: [
                { usuarioSolicitante: userId },
                { propietario: userId }
            ]
        }).select('_id');

        const reservationIds = userReservations.map(r => r._id);

        const mensajes = await Mensaje.find({
            category: 'reservation',
            relatedReservationId: { $in: reservationIds },
            deletedBy: { $ne: userId }
        })
        .populate('sender', 'name email')
        .populate({
            path: 'relatedReservationId',
            populate: { path: 'libro' }
        })
        .sort({ timestamp: 1 });

        return sendSuccess(res, mensajes, 'Mensajes de reservas obtenidos con éxito');
    } catch (error) {
        Logging.error(`Error in getReservasMensajes: ${error}`);
        return sendError(res, error, 'Error al obtener los mensajes de reservas');
    }
};

const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    try {
        const unreadGeneralCount = await Mensaje.countDocuments({
            chat: '000000000000000000000001',
            category: 'general',
            sender: { $ne: userId },
            readBy: { $ne: userId },
            deletedBy: { $ne: userId }
        });

        const userReservations = await Reserva.find({
            $or: [
                { usuarioSolicitante: userId },
                { propietario: userId }
            ]
        }).select('_id');
        const reservationIds = userReservations.map(r => r._id);

        const unreadReservationCount = await Mensaje.countDocuments({
            category: 'reservation',
            relatedReservationId: { $in: reservationIds },
            sender: { $ne: userId },
            readBy: { $ne: userId },
            deletedBy: { $ne: userId }
        });

        // Get all chats of the user (excluding global chat)
        const userChats = await Chat.find({
            participants: userId,
            _id: { $ne: '000000000000000000000001' }
        }).select('_id');
        const userChatIds = userChats.map(c => c._id);

        const unreadPrivateChatsCount = await Mensaje.countDocuments({
            chat: { $in: userChatIds },
            sender: { $ne: userId },
            readBy: { $ne: userId },
            deletedBy: { $ne: userId }
        });

        return sendSuccess(res, {
            total: unreadGeneralCount + unreadReservationCount + unreadPrivateChatsCount,
            general: unreadGeneralCount + unreadPrivateChatsCount,
            reservation: unreadReservationCount
        }, 'Conteo de no leídos obtenido con éxito');
    } catch (error) {
        Logging.error(`Error in getUnreadCount: ${error}`);
        return sendError(res, error, 'Error al obtener el conteo de no leídos');
    }
};

const markGeneralAsRead = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const chatId = req.params.chatId;
    if (!userId) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    try {
        await Mensaje.updateMany(
            {
                chat: chatId,
                category: 'general',
                sender: { $ne: userId },
                readBy: { $ne: userId }
            },
            {
                $addToSet: { readBy: userId }
            }
        );
        return sendSuccess(res, null, 'Mensajes marcados como leídos');
    } catch (error) {
        Logging.error(`Error in markGeneralAsRead: ${error}`);
        return sendError(res, error, 'Error al marcar mensajes como leídos');
    }
};

const markReservationsAsRead = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    try {
        const userReservations = await Reserva.find({
            $or: [
                { usuarioSolicitante: userId },
                { propietario: userId }
            ]
        }).select('_id');
        const reservationIds = userReservations.map(r => r._id);

        await Mensaje.updateMany(
            {
                category: 'reservation',
                relatedReservationId: { $in: reservationIds },
                sender: { $ne: userId },
                readBy: { $ne: userId }
            },
            {
                $addToSet: { readBy: userId }
            }
        );
        return sendSuccess(res, null, 'Mensajes de reservas marcados como leídos');
    } catch (error) {
        Logging.error(`Error in markReservationsAsRead: ${error}`);
        return sendError(res, error, 'Error al marcar mensajes de reservas como leídos');
    }
};

const deleteMensaje = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const mensajeId = req.params.mensajeId;
    if (!userId) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    try {
        await Mensaje.findByIdAndUpdate(
            mensajeId,
            {
                $addToSet: { deletedBy: userId }
            },
            { new: true }
        );
        return sendSuccess(res, null, 'Mensaje eliminado con éxito para el usuario actual');
    } catch (error) {
        Logging.error(`Error in deleteMensaje: ${error}`);
        return sendError(res, error, 'Error al eliminar el mensaje');
    }
};

export default {
    createMensaje,
    getMensajesByChat,
    getReservasMensajes,
    getUnreadCount,
    markGeneralAsRead,
    markReservationsAsRead,
    deleteMensaje
};
