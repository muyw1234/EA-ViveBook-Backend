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
import { IValoracion } from '../models/Valoracion';
import { IReserva } from '../models/Reserva';
import { IReto } from '../models/Reto';
import { ApiError, sendError } from '../library/ApiResponse';

export const ValidateJoi = (schema: ObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.validateAsync(req.body, { abortEarly: false });
      next();
    } catch (error) {
      Logging.error(error);
      const details =
        error && typeof error === 'object' && 'details' in error && Array.isArray(error.details)
          ? error.details.map((detail) => ({
              field: detail.path.join('.'),
              message: detail.message,
              type: detail.type,
            }))
          : null;
      return sendError(
        res,
        new ApiError(
          422,
          'Los datos enviados no superan la validación',
          'VALIDATION_ERROR',
          details,
        ),
      );
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
      expoPushToken: Joi.string().optional(),
      notificationUsersEnabled: Joi.array()
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .optional(),
        )
        .optional(),
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
      expoPushToken: Joi.string().optional(),
      notificationUsersEnabled: Joi.array()
        .items(
          Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .optional(),
        )
        .optional(),
    }),
    adminCreate: Joi.object<IUsuario>({
      name: Joi.string().max(150).required(),
      email: Joi.string().email().max(200).required(),
      password: Joi.string().min(6).max(200).required(),
      rol: Joi.string().valid('Admin', 'User').default('User'),
      avatar: Joi.string().uri().allow('').optional(),
      libros: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      boughtLibros: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      rentedLibros: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      favoriteAuthors: Joi.array().items(Joi.string().max(150)).max(5),
      favoriteBooks: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      favoriteCategories: Joi.array().items(Joi.string().max(100)),
      wishlist: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      followingUsers: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      favoritos: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      notificationUsersEnabled: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      description: Joi.string().allow('').optional(),
      IsDeleted: Joi.boolean().optional(),
      hasSeenTutorial: Joi.boolean().optional(),
    }),
    adminUpdate: Joi.object<IUsuario>({
      name: Joi.string().max(150).optional(),
      email: Joi.string().email().max(200).optional(),
      password: Joi.string().min(6).max(200).allow('').optional(),
      rol: Joi.string().valid('Admin', 'User').optional(),
      avatar: Joi.string().uri().allow('', null).optional(),
      libros: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      boughtLibros: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      rentedLibros: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      favoriteAuthors: Joi.array().items(Joi.string().max(150)).max(5),
      favoriteBooks: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      favoriteCategories: Joi.array().items(Joi.string().max(100)),
      wishlist: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      followingUsers: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      favoritos: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      notificationUsersEnabled: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
      description: Joi.string().allow('').optional(),
      IsDeleted: Joi.boolean().optional(),
      hasSeenTutorial: Joi.boolean().optional(),
    }),
    status: Joi.object<Pick<IUsuario, 'IsDeleted'>>({
      IsDeleted: Joi.boolean().required(),
    }),
    updatePushToken: Joi.object({
      expoPushToken: Joi.string().required(),
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
    status: Joi.object<Pick<IAutor, 'IsDeleted'>>({
      IsDeleted: Joi.boolean().required(),
    }),
  },

  libreria: {
    create: Joi.object<ILibreria>({
      name: Joi.string().required(),
      address: Joi.string().required(),
      IsDeleted: Joi.boolean().optional(),
    }),
    update: Joi.object<ILibreria>({
      name: Joi.string().optional(),
      address: Joi.string().optional(),
      IsDeleted: Joi.boolean().optional(),
    }),
    status: Joi.object<Pick<ILibreria, 'IsDeleted'>>({
      IsDeleted: Joi.boolean().required(),
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
    adminCreate: Joi.object<ILibro>({
      isbn: Joi.string().required(),
      title: Joi.string().required(),
      autor: Joi.string().optional().allow(''),
      categoria: Joi.string().optional().allow(''),
      authors: Joi.array().items(Joi.string()),
      type: Joi.string().valid('VENTA', 'ALQUILER').required(),
      precio: Joi.number().min(0).required(),
      estado: Joi.string().required(),
      owner: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
      IsDeleted: Joi.boolean().optional(),
      rentalStartDate: Joi.date().optional(),
      rentalEndDate: Joi.date().optional(),
      imageUrl: Joi.string().uri().allow('').optional(),
      isReserved: Joi.boolean().optional(),
      reservedBy: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
      reservationExpiry: Joi.date().optional(),
    }),
    adminUpdate: Joi.object<ILibro>({
      isbn: Joi.string().optional(),
      title: Joi.string().optional(),
      autor: Joi.string().optional().allow(''),
      categoria: Joi.string().optional().allow(''),
      authors: Joi.array().items(Joi.string()),
      type: Joi.string().valid('VENTA', 'ALQUILER').optional(),
      precio: Joi.number().min(0).optional(),
      estado: Joi.string().optional(),
      owner: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .allow(null)
        .optional(),
      IsDeleted: Joi.boolean().optional(),
      rentalStartDate: Joi.date().allow(null).optional(),
      rentalEndDate: Joi.date().allow(null).optional(),
      imageUrl: Joi.string().uri().allow('', null).optional(),
      isReserved: Joi.boolean().optional(),
      reservedBy: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .allow(null)
        .optional(),
      reservationExpiry: Joi.date().allow(null).optional(),
    }),
    status: Joi.object<Pick<ILibro, 'IsDeleted'>>({
      IsDeleted: Joi.boolean().required(),
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
    adminCreate: Joi.object<IEvento>({
      title: Joi.string().required(),
      description: Joi.string().required(),
      creator: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      participant: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .optional(),
      eventDate: Joi.date().required(),
      createdDate: Joi.date().optional(),
      direccionExacta: Joi.string().required(),
      location: Joi.object({
        type: Joi.string().valid('Point').required(),
        coordinates: Joi.array().items(Joi.number()).length(2).required(),
      }).required(),
      IsDeleted: Joi.boolean().optional(),
    }),
    adminUpdate: Joi.object<IEvento>({
      title: Joi.string().optional(),
      description: Joi.string().optional(),
      creator: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
      participant: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .optional(),
      eventDate: Joi.date().optional(),
      createdDate: Joi.date().optional(),
      direccionExacta: Joi.string().optional(),
      location: Joi.object({
        type: Joi.string().valid('Point').required(),
        coordinates: Joi.array().items(Joi.number()).length(2).required(),
      }).optional(),
      IsDeleted: Joi.boolean().optional(),
    }),
    status: Joi.object<Pick<IEvento, 'IsDeleted'>>({
      IsDeleted: Joi.boolean().required(),
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
    adminCreate: Joi.object<IPost>({
      description: Joi.string().allow('').required(),
      status: Joi.string().valid('VENTA', 'ALQUILER', 'NO_DISPONIBLE').required(),
      imageUrl: Joi.string().uri().allow('').optional(),
      IsDeleted: Joi.boolean().optional(),
      ownerId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      bookId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      price: Joi.number().min(0).required(),
    }),
    adminUpdate: Joi.object<IPost>({
      description: Joi.string().allow('').optional(),
      status: Joi.string().valid('VENTA', 'ALQUILER', 'NO_DISPONIBLE').optional(),
      imageUrl: Joi.string().uri().allow('', null).optional(),
      IsDeleted: Joi.boolean().optional(),
      ownerId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
      bookId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
      price: Joi.number().min(0).optional(),
    }),
    deletedStatus: Joi.object<Pick<IPost, 'IsDeleted'>>({
      IsDeleted: Joi.boolean().required(),
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
    adminCreate: Joi.object<IValoracion>({
      usuarioAutor: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      usuarioValorado: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      libro: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      tipoOperacion: Joi.string().valid('VENTA', 'ALQUILER', 'RESERVA').required(),
      puntuacion: Joi.number().integer().min(1).max(5).required(),
      comentario: Joi.string().allow('').optional(),
      reservationId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .allow('', null)
        .optional(),
      IsDeleted: Joi.boolean().optional(),
    }),
    adminUpdate: Joi.object<IValoracion>({
      usuarioAutor: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
      usuarioValorado: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
      libro: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
      tipoOperacion: Joi.string().valid('VENTA', 'ALQUILER', 'RESERVA').optional(),
      puntuacion: Joi.number().integer().min(1).max(5).optional(),
      comentario: Joi.string().allow('').optional(),
      reservationId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .allow('', null)
        .optional(),
      IsDeleted: Joi.boolean().optional(),
    }),
    status: Joi.object<Pick<IValoracion, 'IsDeleted'>>({
      IsDeleted: Joi.boolean().required(),
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
    adminCreate: Joi.object<IReserva>({
      libro: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      usuarioSolicitante: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      propietario: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      estado: Joi.string().valid('PENDIENTE', 'ACEPTADA', 'RECHAZADA').required(),
      fechaSolicitud: Joi.date().optional(),
      fechaLimite: Joi.date().allow(null).optional(),
      IsDeleted: Joi.boolean().optional(),
    }),
    adminUpdate: Joi.object<IReserva>({
      libro: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
      usuarioSolicitante: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
      propietario: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
      estado: Joi.string().valid('PENDIENTE', 'ACEPTADA', 'RECHAZADA').optional(),
      fechaSolicitud: Joi.date().optional(),
      fechaLimite: Joi.date().allow(null).optional(),
      IsDeleted: Joi.boolean().optional(),
    }),
    status: Joi.object<Pick<IReserva, 'IsDeleted'>>({
      IsDeleted: Joi.boolean().required(),
    }),
  },
  reto: {
    adminCreate: Joi.object<IReto>({
      title: Joi.string().trim().max(150).required(),
      description: Joi.string().trim().max(1000).required(),
      type: Joi.string()
        .valid(
          'COMPRAR_LIBROS',
          'ALQUILAR_LIBROS',
          'SEGUIR_USUARIOS',
          'RECIBIR_VALORACIONES',
          'ASISTIR_EVENTOS',
          'SUBIR_LIBROS',
        )
        .required(),
      objetivo: Joi.number().integer().min(1).required(),
      activo: Joi.boolean().optional(),
    }),
    adminUpdate: Joi.object<IReto>({
      title: Joi.string().trim().max(150).optional(),
      description: Joi.string().trim().max(1000).optional(),
      type: Joi.string()
        .valid(
          'COMPRAR_LIBROS',
          'ALQUILAR_LIBROS',
          'SEGUIR_USUARIOS',
          'RECIBIR_VALORACIONES',
          'ASISTIR_EVENTOS',
          'SUBIR_LIBROS',
        )
        .optional(),
      objetivo: Joi.number().integer().min(1).optional(),
      activo: Joi.boolean().optional(),
    }),
    status: Joi.object<Pick<IReto, 'activo'>>({
      activo: Joi.boolean().required(),
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
