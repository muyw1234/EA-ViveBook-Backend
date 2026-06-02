import { NextFunction, Request, Response } from 'express';
import RecomendacionService from '../services/Recomendacion';
import { sendSuccess, sendError } from '../library/ApiResponse';

const recomendarLibros = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await RecomendacionService.recomendarLibros({
            query: req.body.query,
            limit: req.body.limit,
            includeDeleted: req.body.includeDeleted
        });

        return sendSuccess(res, result, 'Recomendación generada con éxito');
    } catch (error) {
        return sendError(res, error, 'No se pudo generar la recomendación');
    }
};

const healthCheck = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await RecomendacionService.healthCheck();
        const status = result.ai ? 200 : 503;

        return sendSuccess(res, result, 'Estado del servicio de recomendaciones', status);
    } catch (error) {
        return sendError(res, error, 'No se pudo comprobar el estado del servicio de recomendaciones');
    }
};

const syncLibrosToWeaviate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await RecomendacionService.syncLibrosToWeaviate();
        return sendSuccess(res, result, 'Libros sincronizados con Weaviate');
    } catch (error) {
        return sendError(res, error, 'No se pudieron sincronizar los libros con Weaviate');
    }
};

export default {
    recomendarLibros,
    syncLibrosToWeaviate,
    healthCheck
};
