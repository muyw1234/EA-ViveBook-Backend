import { NextFunction, Request, Response } from 'express';
import EventoService from '../services/Evento';
import { adminEventoSearchFields, AdminEventoSearchField } from '../services/Evento';
import { getPaginationParams, getQueryBoolean } from './Pagination';
import { sendSuccess, sendError } from '../library/ApiResponse';
import { actualizarProgresoRetos } from '../services/Retos';
import { sendPushNotification } from '../services/NotificationService';
import Usuario from '../models/Usuario';
import Evento from '../models/Evento';
import admin from 'firebase-admin';
import path from 'path';
import Usuario from '../models/Usuario';

const createEvento = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).userId;
  try {
    const evento = await EventoService.createEvento(req.body);

    try {
      const userFilter = userId ? { _id: { $ne: userId } } : {};
      const usuariosConToken = await Usuario.find({
        fcmToken: { $exists: true, $ne: null },
        ...userFilter,
      });

      const tokensDestinatarios = usuariosConToken
        .map((user) => (user as any).fcmToken)
        .filter((token) => token !== undefined && token !== '');

      if (tokensDestinatarios.length > 0) {
        const titleEvento = (evento as any).title || (evento as any).name || 'Sin título';
        const mensajePush = {
          notification: {
            title: '📢 ¡Nuevo evento en EA-VIVEBOOK!',
            body: `Se ha creado: "${titleEvento}". ¡Entra a echarle un vistazo!`,
          },
          tokens: tokensDestinatarios,
        };

        const response = await admin.messaging().sendEachForMulticast(mensajePush);
        console.log(
          `FCM: Notificaciones enviadas. Éxito: ${response.successCount}, Fallos: ${response.failureCount}`,
        );
      }
    } catch (fcmError) {
      console.error(`FCM multicast failed: ${fcmError}`);
    }

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
    const filter: any = { IsDeleted: { $ne: true } };
    let sort: any = { eventDate: 1 };

    const timeFilter = req.query.timeFilter as string;

    if (timeFilter === 'upcoming') {
      filter.eventDate = { $gte: new Date() };
      sort = { eventDate: 1 };
    } else if (timeFilter === 'expired') {
      filter.eventDate = { $lt: new Date() };
      sort = { eventDate: -1 };
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { direccionExacta: searchRegex },
      ];
    }

    const eventos = await EventoService.getAllEventos(page, limit, filter, sort);

    return sendSuccess(res, eventos, 'Listado de eventos obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar el listado de eventos');
  }
};

const getAdminEventos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const requestedSearchField =
      typeof req.query.searchField === 'string' ? req.query.searchField : 'title';

    if (!adminEventoSearchFields.includes(requestedSearchField as AdminEventoSearchField)) {
      return sendError(
        res,
        `Campo de búsqueda no permitido: ${requestedSearchField}`,
        'Bad Request',
        400,
      );
    }

    const includeDeleted = getQueryBoolean(req.query.includeDeleted, true);
    const upcoming =
      req.query.upcoming === 'true' ? true : req.query.upcoming === 'false' ? false : undefined;
    const eventos = await EventoService.getAdminEventos({
      page,
      limit,
      search,
      searchField: requestedSearchField as AdminEventoSearchField,
      includeDeleted,
      upcoming,
    });
    return sendSuccess(res, eventos, 'Listado administrativo de eventos obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar el listado administrativo de eventos');
  }
};

const createAdminEvento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evento = await EventoService.createEvento({
      ...req.body,
      createdDate: req.body.createdDate ?? new Date(),
    });
    return sendSuccess(res, evento, 'Evento creado desde el BackOffice', 201);
  } catch (error) {
    return sendError(res, error, 'No se pudo crear el evento desde el BackOffice');
  }
};

const getAdminEvento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evento = await EventoService.getEvento(req.params.eventoId);
    if (!evento) return sendError(res, 'El evento solicitado no existe', 'Not Found', 404);
    return sendSuccess(res, evento, 'Evento obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar el evento');
  }
};

const updateAdminEvento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evento = await EventoService.updateEvento(req.params.eventoId, req.body);
    if (!evento) {
      return sendError(res, 'No se encontró el evento para actualizar', 'Not Found', 404);
    }
    return sendSuccess(res, evento, 'Evento actualizado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al actualizar el evento');
  }
};

const deactivateAdminEvento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evento = await EventoService.setEventoDeleted(req.params.eventoId, true);
    if (!evento) {
      return sendError(res, 'No se encontró el evento para desactivar', 'Not Found', 404);
    }
    return sendSuccess(res, evento, 'Evento desactivado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al desactivar el evento');
  }
};

const setAdminEventoStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evento = await EventoService.setEventoDeleted(req.params.eventoId, req.body.IsDeleted);
    if (!evento) {
      return sendError(res, 'No se encontró el evento para cambiar su estado', 'Not Found', 404);
    }
    return sendSuccess(
      res,
      evento,
      evento.IsDeleted ? 'Evento desactivado con éxito' : 'Evento activado con éxito',
    );
  } catch (error) {
    return sendError(res, error, 'Error al cambiar el estado del evento');
  }
};

const permanentDeleteAdminEvento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evento = await EventoService.permanentDeleteEvento(req.params.eventoId);
    if (!evento) {
      return sendError(res, 'No se encontró el evento para eliminar', 'Not Found', 404);
    }
    return sendSuccess(res, null, 'Evento eliminado definitivamente');
  } catch (error) {
    return sendError(res, error, 'Error al eliminar definitivamente el evento');
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
    const eventoAntes = await Evento.findById(eventoId);
    if (!eventoAntes) {
      return sendError(res, 'No se encontró el evento para participar', 'Not Found', 404);
    }

    const isAlreadyParticipating = (eventoAntes.participant || [])
      .map((id: any) => id.toString())
      .includes(usuarioId);

    const evento = await EventoService.participarEvento(eventoId, usuarioId);

    if (!evento) {
      return sendError(res, 'No se encontró el evento para participar', 'Not Found', 404);
    }

    await actualizarProgresoRetos(usuarioId, 'ASISTIR_EVENTOS');

    const creatorIdStr = evento.creator ? evento.creator.toString() : '';
    if (!isAlreadyParticipating && creatorIdStr && creatorIdStr !== usuarioId) {
      const actorUser = await Usuario.findById(usuarioId);
      const recipient = await Usuario.findById(evento.creator);

      if (actorUser && recipient) {
        await sendPushNotification({
          recipient,
          title: 'Nuevo asistente',
          body: `${actorUser.name} se ha apuntado a tu evento`,
          data: {
            type: 'event_joined',
            actorId: usuarioId,
            targetId: eventoId,
            eventId: eventoId,
          },
        });
      }
    }

    return sendSuccess(res, evento, 'Te has apuntado al evento con éxito');
  } catch (error) {
    console.error('--- ERROR EN PARTICIPAR EVENTO ---');
    console.error(error);
    console.error('----------------------------------');
    return sendError(res, error, 'Error al intentar registrar la participación');
  }
};

const leaveEvento = async (req: Request, res: Response, next: NextFunction) => {
  const { eventoId } = req.params;
  const { usuarioId } = req.body;

  try {
    const evento = await EventoService.leaveEvento(eventoId, usuarioId);

    if (!evento) {
      return sendError(
        res,
        'No se encontró el evento para cancelar participación',
        'Not Found',
        404,
      );
    }

    return sendSuccess(res, evento, 'Has cancelado tu participación con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al intentar salir del evento');
  }
};

export default {
  createEvento,
  getEvento,
  getAllEventos,
  getAdminEventos,
  createAdminEvento,
  getAdminEvento,
  updateAdminEvento,
  deactivateAdminEvento,
  setAdminEventoStatus,
  permanentDeleteAdminEvento,
  getEventosByExactLocation,
  updateEvento,
  deleteEvento,
  restoreEvento,
  participarEvento,
  leaveEvento,
};
