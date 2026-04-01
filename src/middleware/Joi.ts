import Joi, { ObjectSchema } from 'joi';
import { NextFunction, Request, Response } from 'express';
import { IUsuario } from '../models/Usuario';
import { ILibreria } from '../models/Libreria';
import { ILibro } from '../models/Libro';
import { IEvento } from '../models/Evento';
import { IChat } from '../models/Chat';
import { IMensaje } from '../models/Mensaje';
import Logging from '../library/Logging';
import { IAutor } from '../models/Autor';
import { isBindingName } from 'typescript';

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
            password: Joi.string().min(6).required(),
            libros: Joi.array().items(Joi.string().optional()),
            IsDeleted: Joi.boolean().optional()
        }),
        update: Joi.object<IUsuario>({
            name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            password: Joi.string().min(6).optional(),
            libros: Joi.array().items(Joi.string().optional()),
            IsDeleted: Joi.boolean().optional()
        })
    },
    Autor: {
        create: Joi.object<IAutor>({
            fullName: Joi.string().required(),
            IsDeleted: Joi.boolean().optional()
        }),
        update: Joi.object<IAutor>({
            fullName: Joi.string().optional(),
            IsDeleted: Joi.boolean().optional()
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
            isbn: Joi.string().required(),
            title: Joi.string().required(),
            authors: Joi.array().items(Joi.string().optional()),
            IsDeleted: Joi.boolean().optional()
        }),
        update: Joi.object<ILibro>({
            isbn: Joi.string().optional(),
            title: Joi.string().optional(),
            authors: Joi.array().items(Joi.string().optional()),
            IsDeleted: Joi.boolean().optional()
        })
    },
    evento: {
        create: Joi.object<IEvento>({
            title: Joi.string().required(),
            description: Joi.string().required(),
            date: Joi.date().required(),
            libreria: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required()
        }),
        update: Joi.object<IEvento>({
            title: Joi.string().required(),
            description: Joi.string().required(),
            date: Joi.date().required(),
            libreria: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required()
        })
    },
    chat: {
        create: Joi.object<IChat>({
            participants: Joi.array()
                .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
                .min(2)
                .required(),
            libro: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .optional()
        })
    },
    mensaje: {
        create: Joi.object<IMensaje>({
            chat: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required(),
            sender: Joi.string()
                .regex(/^[0-9a-fA-F]{24}$/)
                .required(),
            content: Joi.string().required()
        })
    },
    /*
        Viene del esquema del ejercicio

    */
    signIn: Joi.object<IUsuario>({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required()
    })
};
