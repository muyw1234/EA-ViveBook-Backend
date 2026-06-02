import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import LibroService from '../services/Libro';
import Usuario from '../models/Usuario';
import Logging from '../library/Logging';
import { getPaginationParams } from './Pagination';
import { sendSuccess, sendError } from '../library/ApiResponse';
import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(path.resolve('src/config/firebaseAccountKey.json'))
        });
        console.log('Firebase Admin inicializado correctamente en el Backend');
    } catch (error) {
        console.error('Error inicializando Firebase Admin:', error);
    }
}

const createLibro = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).userId;

        // Add owner to the request body before creating the book
        if (userId) {
            req.body.owner = userId;
        }

        const savedLibro = await LibroService.createLibro(req.body);

        if (savedLibro && userId) {
            const libroId = (savedLibro as any)._id;
            // Update the user's book list
            await Usuario.findByIdAndUpdate(userId, {
                $push: { libros: libroId }
            });
            Logging.info(`Book ${libroId} linked to user ${userId}`);
            try {
                const usuariosConToken = await Usuario.find({
                    fcmToken: { $exists: true, $ne: null },
                    _id: { $ne: userId }
                });

                const tokensDestinatarios = usuariosConToken.map((user) => (user as any).fcmToken).filter((token) => token !== undefined && token !== '');

                if (tokensDestinatarios.length > 0) {
                    const titleBook = (savedLibro as any).title || 'Sin título';
                    const mensajePush = {
                        notification: {
                            title: '📚 ¡Nuevo libro en EA-VIVEBOOK!',
                            body: `Se ha publicado: "${titleBook}". ¡Entra a echarle un vistazo!`
                        },
                        tokens: tokensDestinatarios
                    };

                    const response = await admin.messaging().sendEachForMulticast(mensajePush);
                    Logging.info(`FCM: Notificaciones enviadas. Éxito: ${response.successCount}, Fallos: ${response.failureCount}`);
                }
            } catch (fcmError) {
                Logging.error(`FCM multicast failed: ${fcmError}`);
            }
        } else {
            Logging.warning('Book created but could not link to user (savedLibro or userId missing)');
        }

        return sendSuccess(res, savedLibro, 'Libro creado', 201);
    } catch (error) {
        Logging.error(`Error in createLibro: ${error}`);
        return sendError(res, error, 'No se pudo crear el libro');
    }
};

const getLibro = async (req: Request, res: Response, next: NextFunction) => {
    const libroId = req.params.libroId;
    try {
        const libro = await LibroService.getLibro(libroId);
        if (!libro) {
            return sendError(res, 'El libro solicitado no existe en la base de datos', 'Not Found', 404);
        }
        return sendSuccess(res, libro, 'Libro obtenido con éxito');
    } catch (error) {
        return sendError(res, error, 'Error al procesar la búsqueda del libro');
    }
};

const getAllLibros = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit } = getPaginationParams(req);
        const libros = await LibroService.getAllLibros(page, limit);
        return sendSuccess(res, libros, 'Libros obtenidos con éxito');
    } catch (error) {
        return sendError(res, error, 'Error al recuperar el listado de libros');
    }
};

const getAllLibros_NOT_Deleted = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit } = getPaginationParams(req);
        const userId = req.userId; // Provided by OptionalTokenValidation or TokenValidation
        const libros = await LibroService.getAllLibros_NOT_Deleted(page, limit, userId);
        return sendSuccess(res, libros, 'Libros activos obtenidos con éxito');
    } catch (error) {
        return sendError(res, error, 'Error al recuperar los libros activos');
    }
};

const getLibrosByType = async (req: Request, res: Response, next: NextFunction) => {
    const type = req.params.type;
    const userId = req.userId;
    try {
        const libros = await LibroService.getLibrosByType(type, userId);
        return sendSuccess(res, libros, `Libros de tipo '${type}' obtenidos con éxito`);
    } catch (error) {
        return sendError(res, error, `Error al recuperar los libros de tipo: ${type}`);
    }
};

const updateLibro = async (req: Request, res: Response, next: NextFunction) => {
    const libroId = req.params.libroId;
    try {
        const libro = await LibroService.updateLibro(libroId, req.body);
        if (!libro) {
            return sendError(res, 'No se encontró el libro solicitado para actualizar', 'Not Found', 404);
        }
        return sendSuccess(res, libro, 'Libro actualizado con éxito');
    } catch (error) {
        return sendError(res, error, 'Error al intentar actualizar el libro');
    }
};

const deleteLibro = async (req: Request, res: Response, next: NextFunction) => {
    const libroId = req.params.libroId;
    try {
        const libro = await LibroService.deleteLibro(libroId);
        if (!libro) {
            return sendError(res, 'No se encontró el libro solicitado para eliminar', 'Not Found', 404);
        }
        return sendSuccess(res, libro, 'Libro eliminado con éxito', 200);
    } catch (error) {
        return sendError(res, error, 'Error al intentar eliminar el libro');
    }
};

const restoreLibro = async (req: Request, res: Response, next: NextFunction) => {
    const libroId = req.params.libroId;
    try {
        const libro = await LibroService.restoreLibro(libroId);
        if (!libro) return sendError(res, 'No se encontró el libro para restaurar', 'Not Found', 404);

        return sendSuccess(res, libro, 'Libro restaurado con éxito');
    } catch (error) {
        return sendError(res, error, 'Error al restaurar el libro');
    }
};
/** Para testing */
export async function createLibroByIsbn(req: Request, res: Response, next: NextFunction) {
    const isbn = req.params.isbn;

    try {
        const libro = await LibroService.getLibroByIsbn(isbn);
        Logging.info(`Book found: ${libro}`);
        if (libro !== null) return sendSuccess(res, libro, 'El libro ya existía en la base de datos');

        const libroSaved = await LibroService.createLibroByIsbn(isbn);
        return sendSuccess(res, libroSaved, 'Libro creado mediante ISBN con éxito', 201);
    } catch (error) {
        return sendError(res, error, 'Error crítico al gestionar el libro por ISBN');
    }
}

async function searchLibroByTitle(req: Request, res: Response, next: NextFunction) {
    const { page, limit } = getPaginationParams(req);
    const term: string = req.query.term as string;
    const userId = req.userId;
    Logging.info(`Searching the term: ${term} for user: ${userId || 'anonymous'}`);

    try {
        const libros = await LibroService.searchLibroByTitle(term, page, limit, userId);
        if (libros.length === 0) {
            return sendError(res, `No se encontraron coincidencias para el término: ${term}`, 'Not Found', 404);
        }
        return sendSuccess(res, libros, 'Búsqueda procesada con resultados');
    } catch (error) {
        return sendError(res, error, 'Error al procesar la búsqueda por título');
    }
}

const buyLibro = async (req: Request, res: Response, next: NextFunction) => {
    const libroId = req.params.libroId;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const success = await LibroService.buyLibro(libroId, userId);
        if (success) {
            return res.status(200).json({ message: 'Libro comprado con éxito' });
        } else {
            return res.status(400).json({ message: 'No se pudo completar la compra' });
        }
    } catch (error) {
        Logging.error(`Error in buyLibro controller: ${error}`);
        return res.status(500).json({ error });
    }
};

const rentLibro = async (req: Request, res: Response, next: NextFunction) => {
    const libroId = req.params.libroId;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const success = await LibroService.rentLibro(libroId, userId);
        if (success) {
            return res.status(200).json({ message: 'Libro alquilado con éxito' });
        } else {
            return res.status(400).json({ message: 'No se pudo completar el alquiler' });
        }
    } catch (error) {
        Logging.error(`Error in rentLibro controller: ${error}`);
        return res.status(500).json({ error });
    }
};

export default { createLibro, getLibro, getAllLibros, getAllLibros_NOT_Deleted, getLibrosByType, updateLibro, deleteLibro, restoreLibro, createLibroByIsbn, searchLibroByTitle, buyLibro, rentLibro };
