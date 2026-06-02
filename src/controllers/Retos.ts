import { NextFunction, Request, Response } from 'express';
import { obtenerMisRetos } from '../services/Retos';
import Reto from '../models/Reto';

const getRetos = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const retos = await Reto.find({
            activo: true
        }).sort({
            type: 1,
            objetivo: 1
        });

        return res.status(200).json({
            retos
        });
    } catch (error) {
        return next(error);
    }
};

const getMisRetos = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const usuarioId = req.userId;

        if (!usuarioId) {
            return res.status(401).json({
                message: 'Usuario no autenticado'
            });
        }

        const retos = await obtenerMisRetos(usuarioId);

        return res.status(200).json({
            retos
        });
    } catch (error) {
        return next(error);
    }
};

export default {
    getRetos,
    getMisRetos
};