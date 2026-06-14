import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import ValoracionService, {
  AdminValoracionSearchField,
  adminValoracionSearchFields,
} from '../services/Valoracion';
import Logging from '../library/Logging';
import { actualizarProgresoRetos } from '../services/Retos';
import { sendPushNotification } from '../services/NotificationService';
import Usuario from '../models/Usuario';
import { getPaginationParams, getQueryBoolean } from './Pagination';
import { sendError, sendSuccess } from '../library/ApiResponse';

const createValoracion = async (req: Request, res: Response, next: NextFunction) => {
  const usuarioAutor = req.userId;

  if (!usuarioAutor) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const valoracionData = {
      ...req.body,
      usuarioAutor,
    };

    const savedValoracion = await ValoracionService.createValoracion(valoracionData);

    const usuarioValorado =
      req.body.usuarioValorado ||
      req.body.usuarioReceptor ||
      req.body.usuarioDestino ||
      req.body.usuarioId;

    if (usuarioValorado) {
      await actualizarProgresoRetos(usuarioValorado, 'RECIBIR_VALORACIONES');

      // Send push notification to user being rated if not self
      if (usuarioValorado.toString() !== usuarioAutor.toString()) {
        const actorUser = await Usuario.findById(usuarioAutor);
        const recipient = await Usuario.findById(usuarioValorado);

        if (actorUser && recipient) {
          await sendPushNotification({
            recipient,
            title: 'Nueva valoración',
            body: `Has recibido una valoración de ${actorUser.name}`,
            data: {
              type: 'new_rating',
              actorId: usuarioAutor,
              targetId: savedValoracion?._id || '',
            },
          });
        }
      }
    }

    return res.status(201).json(savedValoracion);
  } catch (error: any) {
    Logging.error(error.message);
    return res.status(400).json({ message: error.message });
  }
};

const getValoracionesReceived = async (req: Request, res: Response, next: NextFunction) => {
  const usuarioId = req.params.usuarioId;

  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    return res.status(200).json({
      valoraciones: [],
      stats: { averageRating: 0, totalReviews: 0 },
    });
  }

  try {
    const valoraciones = await ValoracionService.getValoracionesReceived(usuarioId);
    const stats = await ValoracionService.getRatingStats(usuarioId);

    return res.status(200).json({ valoraciones, stats });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const getValoracionesSent = async (req: Request, res: Response, next: NextFunction) => {
  const usuarioId = req.userId;

  if (!usuarioId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const valoraciones = await ValoracionService.getValoracionesSent(usuarioId);
    return res.status(200).json(valoraciones);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

const getAdminValoraciones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const requestedSearchField =
      typeof req.query.searchField === 'string' ? req.query.searchField : 'user';
    if (!adminValoracionSearchFields.includes(requestedSearchField as AdminValoracionSearchField)) {
      return sendError(
        res,
        `Campo de búsqueda no permitido: ${requestedSearchField}`,
        'Bad Request',
        400,
      );
    }
    const includeDeleted = getQueryBoolean(req.query.includeDeleted, true);
    const parsedRating = Number(req.query.puntuacion);
    const puntuacion =
      Number.isInteger(parsedRating) && parsedRating >= 1 && parsedRating <= 5
        ? parsedRating
        : undefined;
    const tipoOperacion =
      req.query.tipoOperacion === 'VENTA' ||
      req.query.tipoOperacion === 'ALQUILER' ||
      req.query.tipoOperacion === 'RESERVA'
        ? req.query.tipoOperacion
        : undefined;
    const valoraciones = await ValoracionService.getAdminValoraciones({
      page,
      limit,
      search,
      searchField: requestedSearchField as AdminValoracionSearchField,
      includeDeleted,
      puntuacion,
      tipoOperacion,
    });
    return sendSuccess(
      res,
      valoraciones,
      'Listado administrativo de valoraciones obtenido con éxito',
    );
  } catch (error) {
    return sendError(res, error, 'Error al recuperar el listado administrativo de valoraciones');
  }
};

const getAdminValoracion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const valoracion = await ValoracionService.getAdminValoracion(req.params.id);
    if (!valoracion) {
      return sendError(res, 'La valoración solicitada no existe', 'Not Found', 404);
    }
    return sendSuccess(res, valoracion, 'Valoración obtenida con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar la valoración');
  }
};

const createAdminValoracion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const valoracion = await ValoracionService.createAdminValoracion(req.body);
    return sendSuccess(res, valoracion, 'Valoración creada desde el BackOffice', 201);
  } catch (error) {
    return sendError(res, error, 'No se pudo crear la valoración desde el BackOffice');
  }
};

const updateAdminValoracion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const valoracion = await ValoracionService.updateAdminValoracion(req.params.id, req.body);
    if (!valoracion) {
      return sendError(res, 'No se encontró la valoración para actualizar', 'Not Found', 404);
    }
    return sendSuccess(res, valoracion, 'Valoración actualizada con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al actualizar la valoración');
  }
};

const deactivateAdminValoracion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const valoracion = await ValoracionService.setValoracionDeleted(req.params.id, true);
    if (!valoracion) {
      return sendError(res, 'No se encontró la valoración para desactivar', 'Not Found', 404);
    }
    return sendSuccess(res, valoracion, 'Valoración desactivada con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al desactivar la valoración');
  }
};

const setAdminValoracionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const valoracion = await ValoracionService.setValoracionDeleted(
      req.params.id,
      req.body.IsDeleted,
    );
    if (!valoracion) {
      return sendError(
        res,
        'No se encontró la valoración para cambiar su estado',
        'Not Found',
        404,
      );
    }
    return sendSuccess(
      res,
      valoracion,
      valoracion.IsDeleted ? 'Valoración desactivada con éxito' : 'Valoración activada con éxito',
    );
  } catch (error) {
    return sendError(res, error, 'Error al cambiar el estado de la valoración');
  }
};

const permanentDeleteAdminValoracion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const valoracion = await ValoracionService.permanentDeleteValoracion(req.params.id);
    if (!valoracion) {
      return sendError(res, 'No se encontró la valoración para eliminar', 'Not Found', 404);
    }
    return sendSuccess(res, null, 'Valoración eliminada definitivamente');
  } catch (error) {
    return sendError(res, error, 'Error al eliminar definitivamente la valoración');
  }
};

export default {
  createValoracion,
  getValoracionesReceived,
  getValoracionesSent,
  getAdminValoraciones,
  getAdminValoracion,
  createAdminValoracion,
  updateAdminValoracion,
  deactivateAdminValoracion,
  setAdminValoracionStatus,
  permanentDeleteAdminValoracion,
};
