import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import Logging from '../library/Logging';
import bcrypt from 'bcryptjs';

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
    return res.status(401).json({ message: 'No hay token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwt.accessSecret) as IPayload;
    req.userId = payload._id;
    req.userRol = payload.rol;
    next();
  } catch (error) {
    Logging.error(`Token validation error: ${error}`);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
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
