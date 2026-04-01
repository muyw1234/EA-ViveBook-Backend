import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';

export interface IPayload {
    _id: string;
    iat?: number;
    exp?: number;
}

export const TokenValidation = (req: Request, res: Response, next: NextFunction) => {
    //const token = req.header('auth-token');
    //if (!token) return res.status(401).json('Access Denied');
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'No hay token' });
    }
    const token = authHeader.split(' ')[1];

    const payload = jwt.verify(token, config.jwt.accessSecret) as IPayload; // retorna la informacion de ese token, el id que tenia y el tiempo de expiracion
    //if (req.userId !== payload._id) return res.status(401).json({ message: 'Access Denied' , valueInput: 'req.userId'})
    req.userId = payload._id;
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
