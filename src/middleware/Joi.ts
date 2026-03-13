import Joi, { ObjectSchema } from 'joi';
import { NextFunction, Request, Response } from 'express';
import { IUsuario } from '../models/Usuario';
import { ILibreria } from '../models/Libreria';
import { ILibro } from '../models/Libro';
import { IEvento } from '../models/Evento';
import { IChat } from '../models/Chat';
import { IMensaje } from '../models/Mensaje';
import Logging from '../library/Logging';

export const ValidateJoi = (schema: ObjectSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.validateAsync(req.body);

            next();
        } catch (error) {
            Logging.error(error);

            return res.status(422).json({ error });
        }
    };
};

export const Schemas = {
    usuario: {
        create: Joi.object<IUsuario>({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required()
        }),
        update: Joi.object<IUsuario>({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required()
        })
    },
    libreria: {
        create: Joi.object<ILibreria>({
            name: Joi.string().required(),
            address: Joi.string().required()
        }),
        update: Joi.object<ILibreria>({
            name: Joi.string().required(),
            address: Joi.string().required()
        })
    },
    libro: {
        create: Joi.object<ILibro>({
            title: Joi.string().required(),
            author: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            description: Joi.string().required(),
            price: Joi.number().required(),
            type: Joi.string().valid('VENTA', 'ALQUILER').required(),
            owner: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            libreria: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
        }),
        update: Joi.object<ILibro>({
            title: Joi.string().required(),
            author: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            description: Joi.string().required(),
            price: Joi.number().required(),
            type: Joi.string().valid('VENTA', 'ALQUILER').required(),
            owner: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            libreria: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
        })
    },
    evento: {
        create: Joi.object<IEvento>({
            title: Joi.string().required(),
            description: Joi.string().required(),
            date: Joi.date().required(),
            libreria: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        }),
        update: Joi.object<IEvento>({
            title: Joi.string().required(),
            description: Joi.string().required(),
            date: Joi.date().required(),
            libreria: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        })
    },
    chat: {
        create: Joi.object<IChat>({
            participants: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).min(2).required(),
            libro: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
        })
    },
    mensaje: {
        create: Joi.object<IMensaje>({
            chat: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            sender: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            content: Joi.string().required()
        })
    }
};