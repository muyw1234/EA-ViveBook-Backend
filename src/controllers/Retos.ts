import { NextFunction, Request, Response } from 'express';
import {
  createAdminReto,
  AdminRetoSearchField,
  adminRetoSearchFields,
  getAdminReto,
  getAdminRetos,
  obtenerMisRetos,
  permanentDeleteReto,
  setRetoActivo,
  updateAdminReto,
} from '../services/Retos';
import Reto from '../models/Reto';
import { getPaginationParams, getQueryBoolean } from './Pagination';
import { getPagination } from '../services/Pagination';
import { sendSuccess, sendError } from '../library/ApiResponse';

const getRetos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const pagination = getPagination(page, limit);

    const [retos, total] = await Promise.all([
      Reto.find({
        activo: true,
      })
        .sort({
          type: 1,
          objetivo: 1,
        })
        .skip(pagination.skip)
        .limit(pagination.limit),
      Reto.countDocuments({ activo: true }),
    ]);

    return sendSuccess(
      res,
      {
        data: retos,
        pagination: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        },
      },
      'Retos obtenidos con éxito',
    );
  } catch (error) {
    return sendError(res, error, 'Error al obtener los retos');
  }
};

const getMisRetos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = req.userId;

    if (!usuarioId) {
      return sendError(res, 'Usuario no autenticado', 'Unauthorized', 401);
    }

    const { page, limit } = getPaginationParams(req);
    const paginatedRetos = await obtenerMisRetos(usuarioId, page, limit);

    return sendSuccess(res, paginatedRetos, 'Mis retos obtenidos con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al obtener mis retos');
  }
};

const getAdminRetosController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const requestedSearchField =
      typeof req.query.searchField === 'string' ? req.query.searchField : 'title';
    if (!adminRetoSearchFields.includes(requestedSearchField as AdminRetoSearchField)) {
      return sendError(
        res,
        `Campo de búsqueda no permitido: ${requestedSearchField}`,
        'Bad Request',
        400,
      );
    }
    const validTypes = [
      'COMPRAR_LIBROS',
      'ALQUILAR_LIBROS',
      'SEGUIR_USUARIOS',
      'RECIBIR_VALORACIONES',
      'ASISTIR_EVENTOS',
      'SUBIR_LIBROS',
    ] as const;
    const type =
      typeof req.query.type === 'string' &&
      validTypes.includes(req.query.type as (typeof validTypes)[number])
        ? (req.query.type as (typeof validTypes)[number])
        : undefined;
    const result = await getAdminRetos({
      page,
      limit,
      search: typeof req.query.search === 'string' ? req.query.search : '',
      searchField: requestedSearchField as AdminRetoSearchField,
      includeInactive: getQueryBoolean(req.query.includeInactive, true),
      type,
    });
    return sendSuccess(res, result, 'Listado administrativo de retos obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar el listado administrativo de retos');
  }
};

const getAdminRetoController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reto = await getAdminReto(req.params.id);
    if (!reto) return sendError(res, 'El reto solicitado no existe', 'Not Found', 404);
    return sendSuccess(res, reto, 'Reto obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar el reto');
  }
};

const createAdminRetoController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reto = await createAdminReto(req.body);
    return sendSuccess(res, reto, 'Reto creado desde el BackOffice', 201);
  } catch (error) {
    return sendError(res, error, 'No se pudo crear el reto desde el BackOffice');
  }
};

const updateAdminRetoController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reto = await updateAdminReto(req.params.id, req.body);
    if (!reto) return sendError(res, 'No se encontró el reto para actualizar', 'Not Found', 404);
    return sendSuccess(res, reto, 'Reto actualizado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al actualizar el reto');
  }
};

const deactivateAdminReto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reto = await setRetoActivo(req.params.id, false);
    if (!reto) return sendError(res, 'No se encontró el reto para desactivar', 'Not Found', 404);
    return sendSuccess(res, reto, 'Reto desactivado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al desactivar el reto');
  }
};

const setAdminRetoStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reto = await setRetoActivo(req.params.id, req.body.activo);
    if (!reto) {
      return sendError(res, 'No se encontró el reto para cambiar su estado', 'Not Found', 404);
    }
    return sendSuccess(
      res,
      reto,
      reto.activo ? 'Reto activado con éxito' : 'Reto desactivado con éxito',
    );
  } catch (error) {
    return sendError(res, error, 'Error al cambiar el estado del reto');
  }
};

const permanentDeleteAdminReto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reto = await permanentDeleteReto(req.params.id);
    if (!reto) return sendError(res, 'No se encontró el reto para eliminar', 'Not Found', 404);
    return sendSuccess(res, null, 'Reto eliminado definitivamente');
  } catch (error) {
    return sendError(res, error, 'Error al eliminar definitivamente el reto');
  }
};

export default {
  getRetos,
  getMisRetos,
  getAdminRetos: getAdminRetosController,
  getAdminReto: getAdminRetoController,
  createAdminReto: createAdminRetoController,
  updateAdminReto: updateAdminRetoController,
  deactivateAdminReto,
  setAdminRetoStatus,
  permanentDeleteAdminReto,
};
