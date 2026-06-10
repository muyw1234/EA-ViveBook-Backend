import { NextFunction, Request, Response } from 'express';
import EventoService from '../services/Evento';
import { getPaginationParams } from './Pagination';
import { sendSuccess, sendError } from '../library/ApiResponse';
import { actualizarProgresoRetos } from '../services/Retos';

const createEvento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evento = await EventoService.createEvento(req.body);
    return sendSuccess(res, evento, 'Evento creado con éxito', 201);
  } catch (error) {
    return sendError(res, error, 'No se pudo crear el evento');
  }
};

const getEvento = async (req: Request, res: Response, next: NextFunction) => {
  const eventoId = req.params.eventoId;

  try {
    const evento = await EventoService.getEvento(eventoId);

    if (!evento) {
      return sendError(res, 'El evento solicitado no existe', 'Not Found', 404);
    }

    return sendSuccess(res, evento, 'Evento obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al buscar el evento');
  }
};

const getAllEventos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const eventos = await EventoService.getAllEventos(page, limit);

    return sendSuccess(res, eventos, 'Listado de eventos obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar el listado de eventos');
  }
};

const getEventosByExactLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lng, lat } = req.query;

    if (!lng || !lat) {
      return sendError(res, 'Faltan parámetros: lng y lat son requeridos.', 'Bad Request', 400);
    }

    const longitude = parseFloat(lng as string);
    const latitude = parseFloat(lat as string);

    if (isNaN(longitude) || isNaN(latitude)) {
      return sendError(
        res,
        'Formato de coordenadas inválido. Deben ser números válidos.',
        'Bad Request',
        400,
      );
    }

    const eventos = await EventoService.getEventsAtExactLocation(longitude, latitude);

    return sendSuccess(res, eventos, 'Eventos encontrados en la ubicación exacta');
  } catch (error) {
    return sendError(res, error, 'Error al buscar eventos por coordenadas');
  }
};

const updateEvento = async (req: Request, res: Response, next: NextFunction) => {
  const eventoId = req.params.eventoId;

  try {
    const evento = await EventoService.updateEvento(eventoId, req.body);

    if (!evento) {
      return sendError(res, 'No se encontró el evento para actualizar', 'Not Found', 404);
    }

    return sendSuccess(res, evento, 'Evento actualizado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al intentar actualizar el evento');
  }
};

const deleteEvento = async (req: Request, res: Response, next: NextFunction) => {
  const eventoId = req.params.eventoId;

  try {
    const evento = await EventoService.deleteEvento(eventoId);

    if (!evento) {
      return sendError(res, 'No se encontró el evento para eliminar', 'Not Found', 404);
    }

    return sendSuccess(res, evento, 'Evento marcado como eliminado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al intentar eliminar el evento');
  }
};

const restoreEvento = async (req: Request, res: Response, next: NextFunction) => {
  const eventoId = req.params.eventoId;

  try {
    const evento = await EventoService.restoreEvento(eventoId);

    if (!evento) {
      return sendError(res, 'No se encontró el evento para restaurar', 'Not Found', 404);
    }

    return sendSuccess(res, evento, 'Evento restaurado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al intentar restaurar el evento');
  }
};

const participarEvento = async (req: Request, res: Response, next: NextFunction) => {
  const { eventoId } = req.params;
  const { usuarioId } = req.body;

  if (!usuarioId) {
    return sendError(res, 'El ID del usuario es requerido para participar.', 'Bad Request', 400);
  }

  try {
    const evento = await EventoService.participarEvento(eventoId, usuarioId);

    if (!evento) {
      return sendError(res, 'No se encontró el evento para participar', 'Not Found', 404);
    }

    await actualizarProgresoRetos(usuarioId, 'ASISTIR_EVENTOS');

    return sendSuccess(res, evento, 'Te has apuntado al evento con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al intentar registrar la participación');
  }
};

const leaveEvento = async (req: Request, res: Response, next: NextFunction) => {
  const { eventoId } = req.params;
  const { usuarioId } = req.body;

  try {
    const evento = await EventoService.leaveEvento(eventoId, usuarioId);

    if (!evento) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    return res.status(200).json({ success: true, data: evento });
  } catch (error) {
    return sendError(res, error, 'Error al intentar salir del evento');
  }
};

export default {
  createEvento,
  getEvento,
  getAllEventos,
  getEventosByExactLocation,
  updateEvento,
  deleteEvento,
  restoreEvento,
  participarEvento,
  leaveEvento,
};
