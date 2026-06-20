import { Request, Response, NextFunction } from 'express';
import { ApiError, sendError } from '../library/ApiResponse';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userRol = req.userRol;

  if (userRol === 'Admin') {
    next();
  } else {
    return sendError(
      res,
      new ApiError(403, 'Acceso denegado: se requieren permisos de administrador', 'FORBIDDEN'),
    );
  }
};

export const isSelfOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.userId;
  const userRol = req.userRol;
  const targetId = req.params.usuarioId;

  if (userRol === 'Admin' || (userId && userId === targetId)) {
    next();
  } else {
    return sendError(
      res,
      new ApiError(403, 'No tienes permiso para realizar esta acción', 'FORBIDDEN'),
    );
  }
};
