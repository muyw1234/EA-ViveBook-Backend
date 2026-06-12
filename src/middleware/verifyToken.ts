import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import Logging from '../library/Logging';
import bcrypt from 'bcryptjs';
import { ApiError, sendError } from '../library/ApiResponse';

export interface IPayload {
  _id: string;
  rol: 'Admin' | 'User';
  iat?: number;
  exp?: number;
}

export const TokenValidation = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    Logging.warning('Token validation failed: No Authorization header provided');
    return sendError(
      res,
      new ApiError(401, 'No se ha proporcionado un token de acceso', 'UNAUTHORIZED'),
    );
  }

  try {
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return sendError(
        res,
        new ApiError(401, 'El formato del token de acceso no es válido', 'UNAUTHORIZED'),
      );
    }
    const payload = jwt.verify(token, config.jwt.accessSecret) as IPayload;
    req.userId = payload._id;
    req.userRol = payload.rol;
    next();
  } catch (error) {
    Logging.error(`Token validation error: ${error}`);
    return sendError(
      res,
      new ApiError(401, 'El token de acceso es inválido o ha expirado', 'UNAUTHORIZED'),
    );
  }
};

/** Middleware para rutas públicas que pueden mostrar contenido personalizado si el usuario está logueado */
export const OptionalTokenValidation = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const payload = jwt.verify(token, config.jwt.accessSecret) as IPayload;
    req.userId = payload._id;
    req.userRol = payload.rol;
  } catch (error) {
    Logging.warning(`Optional token validation failed: ${error}`);
    // No devolvemos error, simplemente continuamos sin userId
  }
  next();
};

// Una funcion para verificar el rol si lo llegamos a tener
// export function authenticateTokenAndRole(req: Request, res: Response, next: NextFunction) {
//     //authenticateToken(req, res, next);
//     if (!req.user) return res.status(400).json({ message: 'Please, provide user data' });
//     const role = req.user.role;
//     if (req.user.role !== 'Admin') return res.status(401).json({ message: 'You are unauthorized' });
//     next();
// }

// Solamente para crear usuarios.
export async function encryptPassword(req: Request, res: Response, next: NextFunction) {
  const salt = await bcrypt.genSalt(10);
  req.body.password = await bcrypt.hash(req.body.password, salt);
  next();
}
