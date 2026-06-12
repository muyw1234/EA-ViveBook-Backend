import { NextFunction, Request, Response } from 'express';
import LibroService from '../services/Libro';
import Usuario from '../models/Usuario';
import Logging from '../library/Logging';
import { getPaginationParams } from './Pagination';
import { sendSuccess, sendError } from '../library/ApiResponse';
import { actualizarProgresoRetos } from '../services/Retos';
import { sendPushNotification } from '../services/NotificationService';
import Libro from '../models/Libro';

const createLibro = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;

    if (userId) {
      req.body.owner = userId;
    }

    const savedLibro = await LibroService.createLibro(req.body);

    if (savedLibro && userId) {
      const libroId = (savedLibro as any)._id;

      await Usuario.findByIdAndUpdate(userId, {
        $push: { libros: libroId },
      });

      await actualizarProgresoRetos(userId, 'SUBIR_LIBROS');

      Logging.info(`Book ${libroId} linked to user ${userId}`);

      // Send push notification to subscribers
      try {
        const publisher = await Usuario.findById(userId);
        if (publisher) {
          const subscribers = await Usuario.find({
            notificationUsersEnabled: userId,
          });

          for (const subscriber of subscribers) {
            if (subscriber._id.toString() !== userId.toString()) {
              const body =
                savedLibro.type === 'VENTA'
                  ? `${publisher.name} ha publicado un nuevo libro en venta`
                  : `${publisher.name} ha publicado un nuevo libro en alquiler`;

              await sendPushNotification({
                recipient: subscriber,
                title: 'Nueva publicación',
                body,
                data: {
                  type: 'user_new_book',
                  actorId: userId,
                  bookId: libroId.toString(),
                  mode: savedLibro.type === 'VENTA' ? 'venta' : 'alquiler',
                  targetUserId: subscriber._id.toString(),
                },
              });
            }
          }
        }
      } catch (pushErr: any) {
        Logging.error(`Error sending push notifications for new book: ${pushErr.message}`);
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
    const userId = req.userId;

    const extraFilters: any = {};
    if (req.query.type) {
      extraFilters.type = req.query.type;
    }
    if (req.query.categoria) {
      extraFilters.categoria = req.query.categoria;
    }
    if (req.query.maxPrice) {
      const maxP = parseFloat(req.query.maxPrice as string);
      if (!isNaN(maxP)) {
        extraFilters.precio = { $lte: maxP };
      }
    }

    const libros = await LibroService.getAllLibros_NOT_Deleted(page, limit, userId, extraFilters);

    return sendSuccess(res, libros, 'Libros activos obtenidos con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar los libros activos');
  }
};

const getLibrosByType = async (req: Request, res: Response, next: NextFunction) => {
  const type = req.params.type;
  const userId = req.userId;
  const { page, limit } = getPaginationParams(req);

  try {
    const libros = await LibroService.getLibrosByType(type, page, limit, userId);

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

    if (!libro) {
      return sendError(res, 'No se encontró el libro para restaurar', 'Not Found', 404);
    }

    return sendSuccess(res, libro, 'Libro restaurado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al restaurar el libro');
  }
};

export async function createLibroByIsbn(req: Request, res: Response, next: NextFunction) {
  const isbn = req.params.isbn;

  try {
    const libro = await LibroService.getLibroByIsbn(isbn);

    Logging.info(`Book found: ${libro}`);

    if (libro !== null) {
      return sendSuccess(res, libro, 'El libro ya existía en la base de datos');
    }

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

  const extraFilters: any = {};
  if (req.query.type) {
    extraFilters.type = req.query.type;
  }
  if (req.query.categoria) {
    extraFilters.categoria = req.query.categoria;
  }
  if (req.query.maxPrice) {
    const maxP = parseFloat(req.query.maxPrice as string);
    if (!isNaN(maxP)) {
      extraFilters.precio = { $lte: maxP };
    }
  }

  Logging.info(`Searching the term: ${term} for user: ${userId || 'anonymous'}`);

  try {
    const result = await LibroService.searchLibroByTitle(term, page, limit, userId, extraFilters);

    if (result.data.length === 0) {
      return sendError(
        res,
        `No se encontraron coincidencias para el término: ${term}`,
        'Not Found',
        404,
      );
    }

    return sendSuccess(res, result, 'Búsqueda procesada con resultados');
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
      await actualizarProgresoRetos(userId, 'COMPRAR_LIBROS');

      return res.status(200).json({ message: 'Libro comprado con éxito' });
    }

    return res.status(400).json({ message: 'No se pudo completar la compra' });
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
    const libro = await Libro.findById(libroId);
    if (!libro) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    const success = await LibroService.rentLibro(libroId, userId);

    if (success) {
      await actualizarProgresoRetos(userId, 'ALQUILAR_LIBROS');

      // Send push notification to the owner if not self
      if (libro.owner && libro.owner.toString() !== userId) {
        const actorUser = await Usuario.findById(userId);
        const recipient = await Usuario.findById(libro.owner);

        if (actorUser && recipient) {
          await sendPushNotification({
            recipient,
            title: 'Nuevo alquiler',
            body: `${actorUser.name} ha alquilado tu libro`,
            data: {
              type: 'book_rented',
              actorId: userId,
              targetId: libroId,
              bookId: libroId,
            },
          });
        }
      }

      return res.status(200).json({ message: 'Libro alquilado con éxito' });
    }

    return res.status(400).json({ message: 'No se pudo completar el alquiler' });
  } catch (error) {
    Logging.error(`Error in rentLibro controller: ${error}`);
    return res.status(500).json({ error });
  }
};

export default {
  createLibro,
  getLibro,
  getAllLibros,
  getAllLibros_NOT_Deleted,
  getLibrosByType,
  updateLibro,
  deleteLibro,
  restoreLibro,
  createLibroByIsbn,
  searchLibroByTitle,
  buyLibro,
  rentLibro,
};
