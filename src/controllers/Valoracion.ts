import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import ValoracionService from '../services/Valoracion';
import Logging from '../library/Logging';
import { actualizarProgresoRetos } from '../services/Retos';

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

export default {
  createValoracion,
  getValoracionesReceived,
  getValoracionesSent,
};
