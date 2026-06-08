import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import UsuarioService from '../services/Usuario';
import Usuario, { IUsuarioModel } from '../models/Usuario';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { IPayload } from '../middleware/verifyToken';
import Logging from '../library/Logging';
import { sendError, sendSuccess } from '../library/ApiResponse';
import { getUserLevel } from '../services/Niveles';
import socialAuthService from '../services/socialAuth';

//#region Autenticacion

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user: IUsuarioModel = new Usuario({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });

        // Encriptamos la contraseña antes de guardar
        if (user.password) {
            user.password = await user.encryptPassword(user.password);
        }
        const savedUser = await user.save();

        // Generamos el token de acceso
        const token: string = jwt.sign({ _id: savedUser._id, rol: savedUser.rol }, config.jwt.accessSecret);

        // Adjuntamos la cabecera por compatibilidad y respondemos con sendSuccess
        res.header('auth-token', token);
        return sendSuccess(res, { user: savedUser, token }, 'Usuario registrado con éxito', 201);
    } catch (error: any) {
        Logging.error(`Signup error: ${error}`);
        // sendError ya detecta internamente el código 11000 (Clave duplicada)
        // pero le pasamos un mensaje personalizado para el usuario final
        return sendError(res, error, 'El correo electrónico ya está registrado', 400);
    }
};

export const signin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await UsuarioService.getUsuarioByEmail(req.body.email);
        if (!user) {
            return sendError(res, 'Email or password is wrong', 'Credenciales incorrectas', 400);
        }

        const correctPassword: boolean = await user.validatePassword(req.body.password);
        if (!correctPassword) {
            return sendError(res, 'Incorrect password', 'Credenciales incorrectas', 400);
        }

        const token: string = jwt.sign({ _id: user._id, rol: user.rol } as IPayload, config.jwt.accessSecret, {
            expiresIn: 60 * 15 // 15 minutos
        });

        // Adjuntamos la cabecera por compatibilidad y respondemos con sendSuccess
        res.header('auth-token', token);
        return sendSuccess(res, { user, token }, 'Autenticación exitosa', 200);
    } catch (error) {
        Logging.error(`Signin error: ${error}`);
        return sendError(res, error, 'Error interno durante el inicio de sesión', 500);
    }
};

export const profile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: 'No userId found in request' });
        }

        const usuario = await Usuario.findById(req.userId)
            .populate('libros')
            .populate({
                path: 'boughtLibros',
                populate: { path: 'owner', select: '_id name' }
            })
            .populate({
                path: 'rentedLibros',
                populate: { path: 'owner', select: '_id name' }
            })
            .populate('followingUsers', 'name email');

        if (!usuario) {
            Logging.warning(`Profile requested for non-existent user ID: ${req.userId}`);
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const librosCount = Array.isArray(usuario.libros) ? usuario.libros.length : 0;
        Logging.info(`Profile for ${usuario.email} requested. Books count: ${librosCount}`);

        const levelData = await getUserLevel(req.userId);
        const profileData = {
            ...usuario.toObject(),
            ...levelData
        };

        return sendSuccess(res, profileData, 'Perfil de usuario obtenido con éxito', 200);
    } catch (error: any) {
        Logging.error(`Error in profile controller: ${error}`);
        return sendError(res, error, 'Error al obtener el perfil del usuario', 500);
    }
};

export const socialLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { provider, idToken, name } = req.body;

        if (!provider || !idToken) {
            return sendError(res, 'Provider and idToken are required', 'Faltan datos de proveedor o token', 400);
        }

        let socialUser;
        if (provider === 'google') {
            socialUser = await socialAuthService.verifyGoogleToken(idToken);
        } else if (provider === 'apple') {
            socialUser = await socialAuthService.verifyAppleToken(idToken);
            if (name && !socialUser.name) {
                socialUser.name = name;
            }
        } else {
            return sendError(res, 'Invalid provider', 'Proveedor social no soportado', 400);
        }

        let user: IUsuarioModel | null = null;
        if (socialUser.email) {
            user = await UsuarioService.getUsuarioByEmail(socialUser.email);
        }

        if (!user && provider === 'apple' && !socialUser.email) {
            user = await Usuario.findOne({ appleId: socialUser.sub });
        }

        if (!user) {
            const newUserObj: any = {
                name: socialUser.name || 'Usuario de Apple',
                email: socialUser.email || `${socialUser.sub}@apple.placeholder.com`,
                authProvider: provider,
                avatar: socialUser.picture
            };
            
            if (provider === 'google') {
                newUserObj.googleId = socialUser.sub;
            } else if (provider === 'apple') {
                newUserObj.appleId = socialUser.sub;
            }

            user = new Usuario(newUserObj);
            await user.save();
        } else {
            let updated = false;
            if (provider === 'google' && !user.googleId) {
                user.googleId = socialUser.sub;
                updated = true;
            } else if (provider === 'apple' && !user.appleId) {
                user.appleId = socialUser.sub;
                updated = true;
            }
            if (updated) {
                await user.save();
            }
        }

        const token: string = jwt.sign({ _id: user._id, rol: user.rol } as IPayload, config.jwt.accessSecret, {
            expiresIn: 60 * 15
        });

        res.header('auth-token', token);
        return sendSuccess(res, { user, token }, 'Autenticación exitosa', 200);

    } catch (error: any) {
        Logging.error(`Social login error: ${error}`);
        return sendError(res, error, 'Error en inicio de sesión social', 400);
    }
};

//#endregion Autenticacion

export default { signup, signin, profile, socialLogin };
