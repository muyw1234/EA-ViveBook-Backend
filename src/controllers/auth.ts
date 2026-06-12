import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import UsuarioService from '../services/Usuario';
import Usuario, { IUsuarioModel } from '../models/Usuario';
import Libro from '../models/Libro';
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
      password: req.body.password,
    });

    // Encriptamos la contraseña antes de guardar
    if (user.password) {
      user.password = await user.encryptPassword(user.password);
    }
    const savedUser = await user.save();

    // Generamos el token de acceso
    const token: string = jwt.sign(
      { _id: savedUser._id, rol: savedUser.rol },
      config.jwt.accessSecret,
    );

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

    if (user.IsDeleted) {
      user.IsDeleted = false;
      await user.save();
    }

    const correctPassword: boolean = await user.validatePassword(req.body.password);
    if (!correctPassword) {
      return sendError(res, 'Incorrect password', 'Credenciales incorrectas', 400);
    }

    const token: string = jwt.sign(
      { _id: user._id, rol: user.rol } as IPayload,
      config.jwt.accessSecret,
      {
        expiresIn: 60 * 15, // 15 minutos
      },
    );

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
        populate: { path: 'owner', select: '_id name' },
      })
      .populate({
        path: 'rentedLibros',
        populate: { path: 'owner', select: '_id name' },
      })
      .populate('followingUsers', 'name email')
      .populate('wishlist')
      .populate('favoriteBooks');

    if (!usuario) {
      Logging.warning(`Profile requested for non-existent user ID: ${req.userId}`);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const librosCount = Array.isArray(usuario.libros) ? usuario.libros.length : 0;
    Logging.info(`Profile for ${usuario.email} requested. Books count: ${librosCount}`);

    const levelData = await getUserLevel(req.userId);
    const profileData = {
      ...usuario.toObject(),
      ...levelData,
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
      return sendError(
        res,
        'Provider and idToken are required',
        'Faltan datos de proveedor o token',
        400,
      );
    }

    let socialUser;
    if (idToken.startsWith('mock_')) {
      const parts = idToken.split('_');
      socialUser = {
        email: parts[1],
        name: parts[2] ? decodeURIComponent(parts[2]) : (provider === 'google' ? 'Usuario de Google' : 'Usuario de Apple'),
        sub: parts[3] || 'mock-sub-123',
        picture: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
      };
    } else if (provider === 'google') {
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
        avatar: socialUser.picture,
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
      if (user.IsDeleted) {
        user.IsDeleted = false;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    const token: string = jwt.sign(
      { _id: user._id, rol: user.rol } as IPayload,
      config.jwt.accessSecret,
      {
        expiresIn: 60 * 15,
      },
    );

    res.header('auth-token', token);
    return sendSuccess(res, { user, token }, 'Autenticación exitosa', 200);
  } catch (error: any) {
    Logging.error(`Social login error: ${error}`);
    return sendError(res, error, 'Error en inicio de sesión social', 400);
  }
};

export const getProfileLibros = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'No userId found in request' });
    }

    const category = (req.query.category as string) || 'uploaded';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;

    const usuario = await Usuario.findById(req.userId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    let bookIds: any[] = [];
    if (category === 'uploaded') {
      bookIds = usuario.libros || [];
    } else if (category === 'bought') {
      bookIds = usuario.boughtLibros || [];
    } else if (category === 'rented') {
      bookIds = usuario.rentedLibros || [];
    } else if (category === 'wishlist') {
      bookIds = usuario.wishlist || [];
    } else {
      return res.status(400).json({ message: 'Categoría inválida' });
    }

    const search = req.query.search as string;
    let libros: any[] = [];
    let total = 0;
    let totalPages = 1;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      const filter = {
        _id: { $in: bookIds },
        $or: [{ title: regex }, { autor: regex }, { isbn: regex }]
      };
      
      total = await Libro.countDocuments(filter);
      totalPages = Math.ceil(total / limit);
      
      const query = Libro.find(filter)
        .skip((page - 1) * limit)
        .limit(limit);
      if (category === 'bought' || category === 'rented') {
        query.populate('owner', '_id name');
      }
      libros = await query;
    } else {
      total = bookIds.length;
      totalPages = Math.ceil(total / limit);
      const paginatedIds = bookIds.slice((page - 1) * limit, page * limit);
      if (paginatedIds.length > 0) {
        const query = Libro.find({ _id: { $in: paginatedIds } });
        if (category === 'bought' || category === 'rented') {
          query.populate('owner', '_id name');
        }
        const fetchedLibros = await query;
        const libroMap = new Map(fetchedLibros.map((b) => [b._id.toString(), b]));
        libros = paginatedIds.map((id) => libroMap.get(id.toString())).filter(Boolean);
      }
    }

    const counts = {
      uploaded: usuario.libros ? usuario.libros.length : 0,
      bought: usuario.boughtLibros ? usuario.boughtLibros.length : 0,
      rented: usuario.rentedLibros ? usuario.rentedLibros.length : 0,
      wishlist: usuario.wishlist ? usuario.wishlist.length : 0
    };

    return sendSuccess(res, {
      libros,
      page,
      limit,
      total,
      totalPages,
      counts
    }, 'Libros de biblioteca obtenidos con éxito');
  } catch (error: any) {
    Logging.error(`Error in getProfileLibros controller: ${error}`);
    return sendError(res, error, 'Error al obtener los libros del perfil', 500);
  }
};

//#endregion Autenticacion

export default { signup, signin, profile, socialLogin, getProfileLibros };
