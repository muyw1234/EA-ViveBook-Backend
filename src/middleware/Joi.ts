import Joi, { number, ObjectSchema } from 'joi';
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
import { IPost } from '../models/Post';

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
      rol: Joi.string().valid('Admin', 'User').default('User'),
      libros: Joi.array().items(Joi.string().optional()),
      IsDeleted: Joi.boolean().optional(),
    }),
    update: Joi.object<IUsuario>({
      name: Joi.string().optional(),
      email: Joi.string().email().optional(),
      password: Joi.string().min(6).optional(),
      rol: Joi.string().valid('Admin', 'User').optional(),
      libros: Joi.array().items(Joi.string().optional()),
      IsDeleted: Joi.boolean().optional(),
    }),
  },
  Autor: {
    create: Joi.object<IAutor>({
      fullName: Joi.string().required(),
      IsDeleted: Joi.boolean().optional(),
    }),
    update: Joi.object<IAutor>({
      fullName: Joi.string().optional(),
      IsDeleted: Joi.boolean().optional(),
    }),
  },

  libreria: {
    create: Joi.object<ILibreria>({
      name: Joi.string().required(),
      address: Joi.string().required(),
    }),
    update: Joi.object<ILibreria>({
      name: Joi.string().required(),
      address: Joi.string().required(),
    }),
  },
  libro: {
    create: Joi.object<ILibro>({
      isbn: Joi.string().required(),
      title: Joi.string().required(),
      authors: Joi.array().items(Joi.string().optional()),
      type: Joi.string().valid('VENTA', 'ALQUILER').required(),
      precio: Joi.number().required(),
      estado: Joi.string().required(),
      IsDeleted: Joi.boolean().optional(),
    }),
    update: Joi.object<ILibro>({
      isbn: Joi.string().optional(),
      title: Joi.string().optional(),
      authors: Joi.array().items(Joi.string().optional()),
      type: Joi.string().valid('VENTA', 'ALQUILER').optional(),
      precio: Joi.number().optional(),
      estado: Joi.string().optional(),
      IsDeleted: Joi.boolean().optional(),
    }),
  },
  evento: {
    create: Joi.object<IEvento>({
      title: Joi.string().required(),
      description: Joi.string().required(),
      date: Joi.date().required(),
      direccionExacta: Joi.string().required(),
      location: Joi.object({
        type: Joi.string().valid('Point').required(),
        coordinates: Joi.array().items(Joi.number()).length(2).required(),
      }).required(),
      IsDeleted: Joi.boolean().optional(),
    }),
    update: Joi.object<IEvento>({
      title: Joi.string().optional(),
      description: Joi.string().optional(),
      date: Joi.date().optional(),
      direccionExacta: Joi.string().optional(),
      location: Joi.object({
        type: Joi.string().valid('Point').required(),
        coordinates: Joi.array().items(Joi.number()).length(2).required(),
      }).optional(),
      IsDeleted: Joi.boolean().optional(),
    }),
  },
  chat: {
    create: Joi.object<IChat>({
      participants: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .min(2)
        .required(),
      libro: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
    }),
  },
  mensaje: {
    create: Joi.object<IMensaje>({
      chat: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      sender: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      content: Joi.string().required(),
    }),
  },
  post: {
    create: Joi.object<IPost>({
      description: Joi.string().required(),
      status: Joi.string().valid('VENTA', 'ALQUILER', 'NO_DISPONIBLE').required(),
      imageUrl: Joi.string().uri().allow('').optional(),
      IsDeleted: Joi.bool().optional(),
      ownerId: Joi.string().required(),
      bookId: Joi.string().required(),
      price: Joi.number().optional(),
    }),
    update: Joi.object<IPost>({
      description: Joi.string().optional(),
      status: Joi.string().valid('VENTA', 'ALQUILER', 'NO_DISPONIBLE').optional(),
      imageUrl: Joi.string().uri().allow('').optional(),
      IsDeleted: Joi.bool().optional(),
      ownerId: Joi.string().optional(),
      bookId: Joi.string().optional(),
      price: Joi.number().optional(),
    }),
  },
  /*
        Viene del esquema del ejercicio

    */
  signIn: Joi.object<IUsuario>({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
};
