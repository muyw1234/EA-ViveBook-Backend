import { NextFunction, Request, Response } from 'express';
import { obtenerMisRetos } from '../services/Retos';
import Reto from '../models/Reto';
import { getPaginationParams } from './Pagination';
import { getPagination } from '../services/Pagination';
import { sendSuccess, sendError } from '../library/ApiResponse';

const getRetos = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit } = getPaginationParams(req);
        const pagination = getPagination(page, limit);

        const [retos, total] = await Promise.all([
            Reto.find({
                activo: true
            }).sort({
                type: 1,
                objetivo: 1
            }).skip(pagination.skip).limit(pagination.limit),
            Reto.countDocuments({ activo: true })
        ]);

        return sendSuccess(res, {
            data: retos,
            pagination: {
                total,
                page: pagination.page,
                limit: pagination.limit,
                totalPages: Math.ceil(total / pagination.limit)
            }
        }, 'Retos obtenidos con éxito');
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

export default {
    getRetos,
    getMisRetos
};