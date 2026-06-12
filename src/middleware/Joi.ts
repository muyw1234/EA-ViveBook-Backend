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
      password: Joi.string().min(6).optional(),
      authProvider: Joi.string().valid('local', 'google', 'apple').optional(),
      googleId: Joi.string().optional(),
      appleId: Joi.string().optional(),
      avatar: Joi.string().optional(),
      rol: Joi.string().valid('Admin', 'User').default('User'),
      libros: Joi.array().items(Joi.string().optional()),
      favoriteAuthors: Joi.array().items(Joi.string().optional()).max(5).optional(),
      favoriteBooks: Joi.array()
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .optional(),
        )
        .optional(),
      favoriteCategories: Joi.array().items(Joi.string().optional()).optional(),
      wishlist: Joi.array()
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .optional(),
        )
        .optional(),
      followingUsers: Joi.array()
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .optional(),
        )
        .optional(),
      description: Joi.string().optional().allow(''),
      IsDeleted: Joi.boolean().optional(),
      hasSeenTutorial: Joi.boolean().optional(),
    }),
    update: Joi.object<IUsuario>({
      name: Joi.string().optional(),
      email: Joi.string().email().optional(),
      password: Joi.string().min(6).optional(),
      authProvider: Joi.string().valid('local', 'google', 'apple').optional(),
      googleId: Joi.string().optional(),
      appleId: Joi.string().optional(),
      avatar: Joi.string().optional(),
      rol: Joi.string().valid('Admin', 'User').optional(),
      libros: Joi.array().items(Joi.string().optional()),
      favoriteAuthors: Joi.array().items(Joi.string().optional()).max(5).optional(),
      favoriteBooks: Joi.array()
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .optional(),
        )
        .optional(),
      favoriteCategories: Joi.array().items(Joi.string().optional()).optional(),
      wishlist: Joi.array()
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .optional(),
        )
        .optional(),
      followingUsers: Joi.array()
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .optional(),
        )
        .optional(),
      description: Joi.string().optional().allow(''),
      IsDeleted: Joi.boolean().optional(),
      hasSeenTutorial: Joi.boolean().optional(),
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
      autor: Joi.string().optional().allow(''),
      categoria: Joi.string().optional().allow(''),
      authors: Joi.array().items(Joi.string().optional()),
      type: Joi.string().valid('VENTA', 'ALQUILER').required(),
      precio: Joi.number().required(),
      estado: Joi.string().required(),
      IsDeleted: Joi.boolean().optional(),
      rentalStartDate: Joi.date().optional(),
      rentalEndDate: Joi.date().optional(),
      imageUrl: Joi.string().optional(),
    }),
    update: Joi.object<ILibro>({
      isbn: Joi.string().optional(),
      title: Joi.string().optional(),
      autor: Joi.string().optional().allow(''),
      categoria: Joi.string().optional().allow(''),
      authors: Joi.array().items(Joi.string().optional()),
      type: Joi.string().valid('VENTA', 'ALQUILER').optional(),
      precio: Joi.number().optional(),
      estado: Joi.string().optional(),
      IsDeleted: Joi.boolean().optional(),
      rentalStartDate: Joi.date().optional(),
      rentalEndDate: Joi.date().optional(),
      imageUrl: Joi.string().optional(),
    }),
  },
  evento: {
    create: Joi.object<IEvento>({
      title: Joi.string().required(),
      description: Joi.string().required(),
      creator: Joi.string().required(),
      eventDate: Joi.date().required(),
      createdDate: Joi.date().required(),
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
      creator: Joi.string().optional(),
      participant: Joi.object({
        usuarioId: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/)
          .required(),
      }),
      eventDate: Joi.date().optional(),
      createdDate: Joi.date().optional(),
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
  socialLogin: Joi.object({
    provider: Joi.string().valid('google', 'apple').required(),
    idToken: Joi.string().required(),
    name: Joi.string().optional(),
  }),
  valoracion: {
    create: Joi.object({
      usuarioValorado: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      libro: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      tipoOperacion: Joi.string().valid('VENTA', 'ALQUILER', 'RESERVA').required(),
      puntuacion: Joi.number().min(1).max(5).required(),
      comentario: Joi.string().optional().allow(''),
      reservationId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
    }),
  },
  reserva: {
    create: Joi.object({
      libroId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    }),
    aceptar: Joi.object({
      dias: Joi.number().min(1).optional(),
    }),
  },
  messageRequest: {
    create: Joi.object({
      bookId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      initialMessage: Joi.string().optional().allow(''),
    }),
  },
  recomendacion: {
    create: Joi.object({
      query: Joi.string().trim().min(3).required(),
      limit: Joi.number().integer().min(1).max(20).optional(),
      includeDeleted: Joi.boolean().optional(),
      context: Joi.array()
        .items(
          Joi.string().trim().min(1),
          Joi.object({
            title: Joi.string().trim().optional(),
            text: Joi.string().trim().min(1).required(),
          }),
        )
        .optional(),
    }),
  },
};
