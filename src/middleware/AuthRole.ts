import { Request, Response, NextFunction } from 'express';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (user && user.rol === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado: Se requieren permisos de Administrador' });
  }
};
