import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import UsuarioService from '../services/Usuario';
import Usuario, { IUsuarioModel } from '../models/Usuario';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { IPayload } from '../middleware/verifyToken';
import Logging from '../library/Logging';

//#region Autenticacion
// Muchas de estos codigos los he sacado del video directamente, no os asusteis si es que no coinciden con los del ejercicio del seminario.
export const signup = async (req: Request, res: Response, next: NextFunction) => {
    const user: IUsuarioModel = new Usuario({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    });

    // encriptamos
    user.password = await user.encryptPassword(user.password);

    const savedUser = await user.save();
    const token: string = jwt.sign({ _id: savedUser._id }, config.jwt.accessSecret);
    return res.header('auth-token', token).status(201).json(savedUser);
};

export const signin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await UsuarioService.getUsuarioByEmail(req.body.email);
        if (!user) return res.status(400).json('Email or password is wrong');
        const correctPassword: boolean = await user.validatePassword(req.body.password);
        if (!correctPassword) return res.status(400).json('Incorrect password');
        const token: string = jwt.sign({ _id: user._id } as IPayload, config.jwt.accessSecret, {
            expiresIn: 60 * 15 // tiempo de expiracion en segundos, pero poniendo config.jwt.expiresIn siempre me da errores
        });
        return res.header('auth-token', token).status(200).json(user);
    } catch (error) {
        Logging.error(`Signin error: ${error}`);
        return res.status(500).json({ error });
    }
};

// retorna la informacion del perfil
export const profile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const usuario = await Usuario.findById(req.userId).populate('libros');
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        return res.status(200).json(usuario);
    } catch (error) {
        return res.status(500).json({ error });
    }
};
//#endregion Autenticacion

export default { signup, signin, profile };
