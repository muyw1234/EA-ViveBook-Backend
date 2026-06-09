import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import MessageRequest from '../models/MessageRequest';
import Libro from '../models/Libro';
import Chat from '../models/Chat';
import Mensaje from '../models/Mensaje';
import { sendSuccess, sendError } from '../library/ApiResponse';
import Logging from '../library/Logging';

const createMessageRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { bookId, initialMessage } = req.body;
    const requesterId = req.userId;

    if (!requesterId) {
        return sendError(res, 'No autorizado', 'Unauthorized', 401);
    }

    try {
        const book = await Libro.findById(bookId);
        if (!book) {
            return sendError(res, 'El libro no existe', 'Not Found', 404);
        }

        const sellerId = book.owner ? book.owner.toString() : null;
        if (!sellerId) {
            return sendError(res, 'El libro no tiene un vendedor asignado', 'Bad Request', 400);
        }

        if (requesterId === sellerId) {
            return sendError(res, 'No puedes solicitar hablar contigo mismo', 'Bad Request', 400);
        }

        // Check for existing pending request
        const existingPending = await MessageRequest.findOne({
            requester: requesterId,
            seller: sellerId,
            book: bookId,
            status: 'pending'
        });

        if (existingPending) {
            return sendError(res, 'Ya tienes una solicitud pendiente para este libro', 'Conflict', 409);
        }

        // Check if chat already exists
        const existingChat = await Chat.findOne({
            participants: { $all: [requesterId, sellerId] },
            libro: bookId
        });

        if (existingChat) {
            return sendError(res, 'Ya existe un chat activo con este vendedor para este libro', 'Conflict', 409);
        }

        const messageRequest = new MessageRequest({
            _id: new mongoose.Types.ObjectId(),
            requester: requesterId,
            seller: sellerId,
            book: bookId,
            initialMessage,
            status: 'pending'
        });

        const savedRequest = await messageRequest.save();
        await savedRequest.populate('requester seller book');

        // WebSocket notification
        const io = req.app.get('io');
        if (io) {
            io.to(sellerId).emit('newMessageRequest', savedRequest);
        }

        return sendSuccess(res, savedRequest, 'Solicitud de mensaje enviada con éxito', 201);
    } catch (error) {
        Logging.error(error);
        return sendError(res, error, 'Error al crear la solicitud de mensaje');
    }
};

const getReceivedRequests = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    if (!userId) {
        return sendError(res, 'No autorizado', 'Unauthorized', 401);
    }

    try {
        const requests = await MessageRequest.find({
            seller: userId,
            status: 'pending'
        }).populate('requester book');

        return sendSuccess(res, requests, 'Solicitudes recibidas obtenidas con éxito');
    } catch (error) {
        Logging.error(error);
        return sendError(res, error, 'Error al obtener solicitudes recibidas');
    }
};

const getSentRequests = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    if (!userId) {
        return sendError(res, 'No autorizado', 'Unauthorized', 401);
    }

    try {
        // We get all sent requests (active or resolved notices)
        const requests = await MessageRequest.find({
            requester: userId,
            requesterDismissed: false
        }).populate('seller book');

        return sendSuccess(res, requests, 'Solicitudes enviadas obtenidas con éxito');
    } catch (error) {
        Logging.error(error);
        return sendError(res, error, 'Error al obtener solicitudes enviadas');
    }
};

const acceptMessageRequest = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.params.id;
    const userId = req.userId;

    if (!userId) {
        return sendError(res, 'No autorizado', 'Unauthorized', 401);
    }

    try {
        const request = await MessageRequest.findById(requestId);
        if (!request) {
            return sendError(res, 'La solicitud no existe', 'Not Found', 404);
        }

        if (request.seller.toString() !== userId) {
            return sendError(res, 'No tienes permiso para aceptar esta solicitud', 'Forbidden', 403);
        }

        request.status = 'accepted';
        await request.save();

        // Create or reuse private chat
        let chat = await Chat.findOne({
            participants: { $all: [request.requester, request.seller] },
            libro: request.book
        });

        if (!chat) {
            chat = new Chat({
                _id: new mongoose.Types.ObjectId(),
                participants: [request.requester, request.seller],
                libro: request.book
            });
            await chat.save();

            // Create initial message if present
            if (request.initialMessage) {
                const nuevoMensaje = new Mensaje({
                    _id: new mongoose.Types.ObjectId(),
                    chat: chat._id,
                    sender: request.requester,
                    content: request.initialMessage,
                    timestamp: new Date()
                });
                await nuevoMensaje.save();
            }
        }

        await chat.populate('participants libro');

        // WebSocket notification
        const io = req.app.get('io');
        if (io) {
            // Notify requester that the chat has been created
            io.to(request.requester.toString()).emit('newChatNotification', {
                chat,
                request
            });
            // Notify seller as well for UI updates
            io.to(request.seller.toString()).emit('newChatNotification', {
                chat,
                request
            });
        }

        return sendSuccess(res, chat, 'Solicitud aceptada y chat creado con éxito');
    } catch (error) {
        Logging.error(error);
        return sendError(res, error, 'Error al aceptar la solicitud');
    }
};

const denyMessageRequest = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.params.id;
    const userId = req.userId;

    if (!userId) {
        return sendError(res, 'No autorizado', 'Unauthorized', 401);
    }

    try {
        const request = await MessageRequest.findById(requestId);
        if (!request) {
            return sendError(res, 'La solicitud no existe', 'Not Found', 404);
        }

        if (request.seller.toString() !== userId) {
            return sendError(res, 'No tienes permiso para denegar esta solicitud', 'Forbidden', 403);
        }

        request.status = 'denied';
        await request.save();

        // WebSocket notification
        const io = req.app.get('io');
        if (io) {
            io.to(request.requester.toString()).emit('newMessageRequestUpdate', request);
        }

        return sendSuccess(res, request, 'Solicitud denegada con éxito');
    } catch (error) {
        Logging.error(error);
        return sendError(res, error, 'Error al denegar la solicitud');
    }
};

const dismissMessageRequest = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.params.id;
    const userId = req.userId;

    if (!userId) {
        return sendError(res, 'No autorizado', 'Unauthorized', 401);
    }

    try {
        const request = await MessageRequest.findById(requestId);
        if (!request) {
            return sendError(res, 'La solicitud no existe', 'Not Found', 404);
        }

        if (request.requester.toString() === userId) {
            request.requesterDismissed = true;
        } else if (request.seller.toString() === userId) {
            request.sellerDismissed = true;
        } else {
            return sendError(res, 'No tienes permiso para descartar esta solicitud', 'Forbidden', 403);
        }

        await request.save();
        return sendSuccess(res, null, 'Solicitud descartada con éxito');
    } catch (error) {
        Logging.error(error);
        return sendError(res, error, 'Error al descartar la solicitud');
    }
};

export default {
    createMessageRequest,
    getReceivedRequests,
    getSentRequests,
    acceptMessageRequest,
    denyMessageRequest,
    dismissMessageRequest
};
