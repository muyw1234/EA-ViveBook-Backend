import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Reserva from '../models/Reserva';
import Libro from '../models/Libro';
import Mensaje from '../models/Mensaje';
import Logging from '../library/Logging';
import { sendSuccess, sendError } from '../library/ApiResponse';
import { getPaginationParams } from './Pagination';
import { getPagination } from '../services/Pagination';
import { getQueryBoolean } from './Pagination';
import ReservaService, {
  AdminReservaSearchField,
  adminReservaSearchFields,
} from '../services/Reserva';

const solicitarReserva = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const { libroId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const libro = await Libro.findById(libroId);
    if (!libro) {
      return sendError(res, 'El libro no existe', 'Not Found', 404);
    }

    if (libro.IsDeleted) {
      return sendError(res, 'El libro ya no está disponible para reserva', 'Bad Request', 400);
    }

    if (libro.isReserved) {
      return sendError(res, 'El libro ya está reservado', 'Bad Request', 400);
    }

    if (!libro.owner) {
      return sendError(
        res,
        'Este libro no tiene propietario registrado y no se puede reservar',
        'Bad Request',
        400,
      );
    }

    if (libro.owner.toString() === userId.toString()) {
      return sendError(res, 'No puedes reservar tu propio libro', 'Bad Request', 400);
    }

    const existingActive = await Reserva.findOne({
      libro: libroId,
      usuarioSolicitante: userId,
      estado: { $in: ['PENDIENTE', 'ACEPTADA'] },
      IsDeleted: { $ne: true },
    });

    if (existingActive) {
      return sendError(
        res,
        'Ya tienes una reserva pendiente o aceptada para este libro',
        'Bad Request',
        400,
      );
    }

    const reserva = new Reserva({
      _id: new mongoose.Types.ObjectId(),
      libro: libroId,
      usuarioSolicitante: userId,
      propietario: libro.owner,
      estado: 'PENDIENTE',
    });

    const savedReserva = await reserva.save();

    // Enviar mensaje automático al chat global
    const libroTitle = libro ? libro.title : 'Libro';
    const nuevoMensaje = new Mensaje({
      _id: new mongoose.Types.ObjectId(),
      chat: '000000000000000000000001', // Global Chat ID
      sender: userId, // El solicitante
      content: `Se ha solicitado la reserva del libro "${libroTitle}".`,
      category: 'reservation',
      relatedReservationId: savedReserva._id,
      timestamp: new Date(),
    });
    await nuevoMensaje.save();

    const io = req.app.get('io');
    if (io) {
      const populated = await nuevoMensaje.populate('sender', 'name email');
      io.to('000000000000000000000001').emit('receive_message', populated);
    }

    return sendSuccess(res, savedReserva, 'Reserva solicitada con éxito', 201);
  } catch (error) {
    Logging.error(`Error in solicitarReserva: ${error}`);
    return sendError(res, error, 'No se pudo solicitar la reserva');
  }
};

const aceptarReserva = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const reservaId = req.params.reservaId;
    const { dias } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const reserva = await Reserva.findById(reservaId);
    if (!reserva) {
      return sendError(res, 'La reserva no existe', 'Not Found', 404);
    }

    if (reserva.IsDeleted) {
      return sendError(res, 'La reserva está desactivada', 'Bad Request', 400);
    }

    if (reserva.propietario.toString() !== userId.toString()) {
      return sendError(res, 'No eres el propietario de este libro', 'Unauthorized', 401);
    }

    if (reserva.estado !== 'PENDIENTE') {
      return sendError(res, 'La reserva no está pendiente', 'Bad Request', 400);
    }

    const libro = await Libro.findById(reserva.libro);
    if (!libro || libro.IsDeleted) {
      return sendError(res, 'El libro ya no está disponible', 'Bad Request', 400);
    }

    const diasValidez = dias ? parseInt(dias) : 7;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasValidez);

    reserva.estado = 'ACEPTADA';
    reserva.fechaLimite = fechaLimite;
    await reserva.save();

    libro.isReserved = true;
    libro.reservedBy = reserva.usuarioSolicitante;
    libro.reservationExpiry = fechaLimite;
    await libro.save();

    // Rechazar otras reservas pendientes para el mismo libro
    const otrasPendientes = await Reserva.find({
      libro: libro._id,
      _id: { $ne: reserva._id },
      estado: 'PENDIENTE',
    });

    for (const otra of otrasPendientes) {
      otra.estado = 'RECHAZADA';
      await otra.save();

      // Enviar mensaje de rechazo para cada una
      const nuevoMsgRechazo = new Mensaje({
        _id: new mongoose.Types.ObjectId(),
        chat: '000000000000000000000001',
        sender: userId, // El propietario que acepta y rechaza los otros
        content: `Tu solicitud de reserva para el libro "${libro.title}" ha sido rechazada.`,
        category: 'reservation',
        relatedReservationId: otra._id,
        timestamp: new Date(),
      });
      await nuevoMsgRechazo.save();

      const io = req.app.get('io');
      if (io) {
        const populated = await nuevoMsgRechazo.populate('sender', 'name email');
        io.to('000000000000000000000001').emit('receive_message', populated);
      }
    }

    // Crear mensaje automático de aceptación
    const nuevoMensaje = new Mensaje({
      _id: new mongoose.Types.ObjectId(),
      chat: '000000000000000000000001',
      sender: userId, // El propietario
      content: `La solicitud de reserva para el libro "${libro.title}" ha sido aceptada.`,
      category: 'reservation',
      relatedReservationId: reserva._id,
      timestamp: new Date(),
    });
    await nuevoMensaje.save();

    const io = req.app.get('io');
    if (io) {
      const populated = await nuevoMensaje.populate('sender', 'name email');
      io.to('000000000000000000000001').emit('receive_message', populated);
    }

    return sendSuccess(res, reserva, 'Reserva aceptada con éxito');
  } catch (error) {
    Logging.error(`Error in aceptarReserva: ${error}`);
    return sendError(res, error, 'No se pudo aceptar la reserva');
  }
};

const rechazarReserva = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const reservaId = req.params.reservaId;

    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const reserva = await Reserva.findById(reservaId);
    if (!reserva) {
      return sendError(res, 'La reserva no existe', 'Not Found', 404);
    }

    if (reserva.IsDeleted) {
      return sendError(res, 'La reserva está desactivada', 'Bad Request', 400);
    }

    if (reserva.propietario.toString() !== userId.toString()) {
      return sendError(res, 'No eres el propietario de este libro', 'Unauthorized', 401);
    }

    if (reserva.estado !== 'PENDIENTE') {
      return sendError(res, 'La reserva no está pendiente', 'Bad Request', 400);
    }

    reserva.estado = 'RECHAZADA';
    await reserva.save();

    // Enviar mensaje al solicitante en el chat global
    const libro = await Libro.findById(reserva.libro);
    const libroTitle = libro ? libro.title : 'Libro';

    const nuevoMensaje = new Mensaje({
      _id: new mongoose.Types.ObjectId(),
      chat: '000000000000000000000001', // Global Chat ID
      sender: userId, // El propietario que rechaza
      content: `Tu solicitud de reserva para el libro "${libroTitle}" ha sido rechazada.`,
      category: 'reservation',
      relatedReservationId: reserva._id,
      timestamp: new Date(),
    });
    await nuevoMensaje.save();

    const io = req.app.get('io');
    if (io) {
      const populated = await nuevoMensaje.populate('sender', 'name email');
      io.to('000000000000000000000001').emit('receive_message', populated);
    }

    return sendSuccess(res, reserva, 'Reserva rechazada con éxito');
  } catch (error) {
    Logging.error(`Error in rechazarReserva: ${error}`);
    return sendError(res, error, 'No se pudo rechazar la reserva');
  }
};

const getReservasSolicitadas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const pagination = getPagination(page, limit);
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const query = {
      usuarioSolicitante: userId,
      deletedBy: { $ne: userId },
      IsDeleted: { $ne: true },
    };
    const [data, total] = await Promise.all([
      Reserva.find(query)
        .sort({ _id: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate('libro')
        .populate('propietario', 'name email'),
      Reserva.countDocuments(query),
    ]);

    const result = {
      data,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };

    return sendSuccess(res, result, 'Reservas solicitadas obtenidas con éxito');
  } catch (error) {
    Logging.error(`Error in getReservasSolicitadas: ${error}`);
    return sendError(res, error, 'Error al obtener las reservas solicitadas');
  }
};

const getReservasRecibidas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const pagination = getPagination(page, limit);
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const query = {
      propietario: userId,
      deletedBy: { $ne: userId },
      IsDeleted: { $ne: true },
    };
    const [data, total] = await Promise.all([
      Reserva.find(query)
        .sort({ _id: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate('libro')
        .populate('usuarioSolicitante', 'name email'),
      Reserva.countDocuments(query),
    ]);

    const result = {
      data,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };

    return sendSuccess(res, result, 'Solicitudes recibidas obtenidas con éxito');
  } catch (error) {
    Logging.error(`Error in getReservasRecibidas: ${error}`);
    return sendError(res, error, 'Error al obtener las solicitudes de reserva recibidas');
  }
};

const deleteReserva = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.userId;
  const reservaId = req.params.reservaId;

  if (!userId) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    const reserva = await Reserva.findById(reservaId);
    if (!reserva) {
      return sendError(res, 'La reserva no existe', 'Not Found', 404);
    }

    await Reserva.findByIdAndUpdate(reservaId, { $addToSet: { deletedBy: userId } }, { new: true });

    return sendSuccess(res, null, 'Reserva eliminada con éxito para el usuario actual');
  } catch (error) {
    Logging.error(`Error in deleteReserva: ${error}`);
    return sendError(res, error, 'Error al intentar eliminar la reserva');
  }
};

const getAdminReservas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const requestedSearchField =
      typeof req.query.searchField === 'string' ? req.query.searchField : 'user';
    if (!adminReservaSearchFields.includes(requestedSearchField as AdminReservaSearchField)) {
      return sendError(
        res,
        `Campo de búsqueda no permitido: ${requestedSearchField}`,
        'Bad Request',
        400,
      );
    }
    const estado =
      req.query.estado === 'PENDIENTE' ||
      req.query.estado === 'ACEPTADA' ||
      req.query.estado === 'RECHAZADA'
        ? req.query.estado
        : undefined;
    const result = await ReservaService.getAdminReservas({
      page,
      limit,
      search: typeof req.query.search === 'string' ? req.query.search : '',
      searchField: requestedSearchField as AdminReservaSearchField,
      includeDeleted: getQueryBoolean(req.query.includeDeleted, true),
      estado,
    });
    return sendSuccess(res, result, 'Listado administrativo de reservas obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar el listado administrativo de reservas');
  }
};

const getAdminReserva = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await ReservaService.getAdminReserva(req.params.id);
    if (!reserva) return sendError(res, 'La reserva solicitada no existe', 'Not Found', 404);
    return sendSuccess(res, reserva, 'Reserva obtenida con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar la reserva');
  }
};

const createAdminReserva = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await ReservaService.createAdminReserva(req.body);
    return sendSuccess(res, reserva, 'Reserva creada desde el BackOffice', 201);
  } catch (error) {
    return sendError(res, error, 'No se pudo crear la reserva desde el BackOffice');
  }
};

const updateAdminReserva = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await ReservaService.updateAdminReserva(req.params.id, req.body);
    if (!reserva) {
      return sendError(res, 'No se encontró la reserva para actualizar', 'Not Found', 404);
    }
    return sendSuccess(res, reserva, 'Reserva actualizada con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al actualizar la reserva');
  }
};

const deactivateAdminReserva = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await ReservaService.setReservaDeleted(req.params.id, true);
    if (!reserva) {
      return sendError(res, 'No se encontró la reserva para desactivar', 'Not Found', 404);
    }
    return sendSuccess(res, reserva, 'Reserva desactivada con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al desactivar la reserva');
  }
};

const setAdminReservaStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await ReservaService.setReservaDeleted(req.params.id, req.body.IsDeleted);
    if (!reserva) {
      return sendError(res, 'No se encontró la reserva para cambiar su estado', 'Not Found', 404);
    }
    return sendSuccess(
      res,
      reserva,
      reserva.IsDeleted ? 'Reserva desactivada con éxito' : 'Reserva restaurada con éxito',
    );
  } catch (error) {
    return sendError(res, error, 'Error al cambiar el estado de la reserva');
  }
};

const permanentDeleteAdminReserva = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = await ReservaService.permanentDeleteReserva(req.params.id);
    if (!reserva) {
      return sendError(res, 'No se encontró la reserva para eliminar', 'Not Found', 404);
    }
    return sendSuccess(res, null, 'Reserva eliminada definitivamente');
  } catch (error) {
    return sendError(res, error, 'Error al eliminar definitivamente la reserva');
  }
};

export default {
  solicitarReserva,
  aceptarReserva,
  rechazarReserva,
  getReservasSolicitadas,
  getReservasRecibidas,
  deleteReserva,
  getAdminReservas,
  getAdminReserva,
  createAdminReserva,
  updateAdminReserva,
  deactivateAdminReserva,
  setAdminReservaStatus,
  permanentDeleteAdminReserva,
};
