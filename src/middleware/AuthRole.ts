import { Request, Response, NextFunction } from 'express';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userRol = req.userRol;

  if (userRol === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado: Se requieren permisos de Administrador' });
  }
};

export const isSelfOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.userId;
  const userRol = req.userRol;
  const targetId = req.params.usuarioId;

  if (userRol === 'Admin' || (userId && userId === targetId)) {
    next();
  } else {
    res
      .status(403)
      .json({ message: 'Acceso denegado: No tienes permiso para realizar esta acción' });
  }
};
