import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import UsuarioService from '../services/Usuario';
import Usuario from '../models/Usuario';
import { getPaginationParams } from './Pagination';
import Logging from '../library/Logging';
import { sendSuccess, sendError } from '../library/ApiResponse';
import { actualizarProgresoRetos } from '../services/Retos';
import { getUserLevel } from '../services/Niveles';
import { sendPushNotification } from '../services/NotificationService';
import Libro from '../models/Libro';

const createUsuario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const savedUsuario = await UsuarioService.createUsuario(req.body);
    return sendSuccess(res, savedUsuario, 'Usuario registrado con éxito', 201);
  } catch (error) {
    return sendError(res, error, 'No se pudo registrar el usuario');
  }
};

const getUsuario = async (req: Request, res: Response, next: NextFunction) => {
  const usuarioId = req.params.usuarioId;

  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const usuario = await UsuarioService.getUsuario(usuarioId);

    if (!usuario) {
      return sendError(res, 'El usuario solicitado no existe', 'Not Found', 404);
    }

    const levelData = await getUserLevel(usuarioId);
    const profileData = {
      ...usuario.toObject(),
      ...levelData,
    };

    return sendSuccess(res, profileData, 'Usuario obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al procesar la búsqueda del usuario');
  }
};

const getFollowers = async (req: Request, res: Response, next: NextFunction) => {
  const usuarioId = req.params.usuarioId;

  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const followers = await UsuarioService.getFollowers(usuarioId);
    return res.status(200).json(followers);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const getAllUsuarios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const usuarios = await UsuarioService.getAllUsuarios(page, limit);

    return sendSuccess(res, usuarios, 'Listado de usuarios obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar la lista de usuarios');
  }
};

const getAllUsuarios_NOT_Deleted = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const usuarios = await UsuarioService.getAllUsuarios_NOT_Deleted(page, limit);

    return sendSuccess(res, usuarios, 'Listado de usuarios activos obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar los usuarios activos');
  }
};

const updateUsuario = async (req: Request, res: Response, next: NextFunction) => {
  const usuarioId = req.params.usuarioId;

  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const usuarioAntes = await Usuario.findById(usuarioId);

    if (!usuarioAntes) {
      return sendError(res, 'No se encontró el usuario para actualizar', 'Not Found', 404);
    }

    const followingAntes = Array.isArray((usuarioAntes as any).followingUsers)
      ? (usuarioAntes as any).followingUsers.map((id: any) => id.toString())
      : [];

    const updatedUsuario = await UsuarioService.updateUsuario(usuarioId, req.body);

    if (!updatedUsuario) {
      return sendError(res, 'No se encontró el usuario para actualizar', 'Not Found', 404);
    }

    const followingDespues = Array.isArray((updatedUsuario as any).followingUsers)
      ? (updatedUsuario as any).followingUsers.map((id: any) => id.toString())
      : [];

    if (req.body.followingUsers && followingDespues.length > followingAntes.length) {
      await actualizarProgresoRetos(
        usuarioId,
        'SEGUIR_USUARIOS',
        followingDespues.length - followingAntes.length,
      );
    }

    // Push notification integration for follow
    if (req.body.followingUsers) {
      const newlyFollowed = followingDespues.filter((id: string) => !followingAntes.includes(id));
      for (const targetUserId of newlyFollowed) {
        if (targetUserId !== usuarioId) {
          const recipient = await Usuario.findById(targetUserId);
          if (recipient) {
            await sendPushNotification({
              recipient,
              title: 'Nuevo seguidor',
              body: `${updatedUsuario.name} ha empezado a seguirte`,
              data: {
                type: 'new_follower',
                actorId: usuarioId,
                targetId: targetUserId,
              },
            });
          }
        }
      }

      const unfollowed = followingAntes.filter((id: string) => !followingDespues.includes(id));
      if (unfollowed.length > 0) {
        await Usuario.findByIdAndUpdate(usuarioId, {
          $pull: { notificationUsersEnabled: { $in: unfollowed } },
        });
      }
    }

    return sendSuccess(res, updatedUsuario, 'Usuario actualizado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al intentar actualizar el usuario');
  }
};

const deleteUsuario = async (req: Request, res: Response, next: NextFunction) => {
  const usuarioId = req.params.usuarioId;

  try {
    const usuario = await UsuarioService.deleteUsuario(usuarioId);

    if (!usuario) {
      return sendError(
        res,
        'No se encontró el usuario para realizar el borrado lógico',
        'Not Found',
        404,
      );
    }

    return sendSuccess(res, usuario, 'Usuario desactivado con éxito (borrado lógico)');
  } catch (error) {
    return sendError(res, error, 'Error al intentar desactivar el usuario');
  }
};

const permanentDeleteUsuario = async (req: Request, res: Response, next: NextFunction) => {
  const usuarioId = req.params.usuarioId;

  try {
    const usuario = await UsuarioService.permanentDeleteUsuario(usuarioId);

    if (!usuario) {
      return sendError(res, 'No se encontró el usuario para eliminación física', 'Not Found', 404);
    }

    return sendSuccess(res, null, 'Usuario eliminado permanentemente de la base de datos', 200);
  } catch (error) {
    return sendError(res, error, 'Error al intentar eliminar permanentemente el usuario');
  }
};

const restoreUsuario = async (req: Request, res: Response, next: NextFunction) => {
  const usuarioId = req.params.usuarioId;

  try {
    const usuario = await UsuarioService.restoreUsuario(usuarioId);

    if (!usuario) {
      return sendError(res, 'No se encontró el usuario para restaurar', 'Not Found', 404);
    }

    return sendSuccess(res, usuario, 'Usuario restaurado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al intentar restaurar el usuario');
  }
};

async function searchUsuarioByName(req: Request, res: Response, next: NextFunction) {
  const { page, limit } = getPaginationParams(req);
  const term: string = req.query.term as string;

  Logging.info(`Searching the term: ${term}`);

  try {
    const result = await UsuarioService.searchUsuarioByName(term, page, limit);

    if (result.data.length === 0) {
      return sendError(
        res,
        `No se encontraron usuarios coincidentes con el término: ${term}`,
        'Not Found',
        404,
      );
    }

    return sendSuccess(res, result, 'Búsqueda de usuarios realizada con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al procesar la búsqueda de usuarios');
  }
}

const toggleWishlist = async (req: Request, res: Response, next: NextFunction) => {
  const libroId = req.params.libroId;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(libroId)) {
    return res.status(400).json({ message: 'Invalid book ID format' });
  }
  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const usuario = await Usuario.findById(userId);
    if (!usuario) {
      return sendError(res, 'Usuario no encontrado', 'Not Found', 404);
    }

    if (!usuario.wishlist) {
      usuario.wishlist = [];
    }

    const index = usuario.wishlist.findIndex((id: any) => id && id.toString() === libroId);
    let message = '';
    if (index > -1) {
      usuario.wishlist.splice(index, 1);
      message = 'Libro eliminado de la lista de deseos';
    } else {
      usuario.wishlist.push(libroId);
      message = 'Libro añadido a la lista de deseos';
    }

    usuario.markModified('wishlist');
    await usuario.save();
    return sendSuccess(res, usuario, message);
  } catch (error) {
    return sendError(res, error, 'Error al modificar la lista de deseos');
  }
};

const toggleFavorite = async (req: Request, res: Response, next: NextFunction) => {
  const libroId = req.params.libroId;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(libroId)) {
    return res.status(400).json({ message: 'Invalid book ID format' });
  }
  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const usuario = await Usuario.findById(userId);
    if (!usuario) {
      return sendError(res, 'Usuario no encontrado', 'Not Found', 404);
    }

    if (!usuario.favoriteBooks) {
      usuario.favoriteBooks = [];
    }

    const index = usuario.favoriteBooks.findIndex((id: any) => id && id.toString() === libroId);
    let message = '';
    if (index > -1) {
      usuario.favoriteBooks.splice(index, 1);
      message = 'Libro eliminado de favoritos';
    } else {
      usuario.favoriteBooks.push(libroId);
      message = 'Libro añadido a favoritos';
    }

    usuario.markModified('favoriteBooks');
    await usuario.save();
    return sendSuccess(res, usuario, message);
  } catch (error) {
    return sendError(res, error, 'Error al modificar favoritos');
  }
};

const toggleFavorito = async (req: Request, res: Response, next: NextFunction) => {
  const { libroId } = req.params;
  const usuarioId = req.userId;

  if (!usuarioId) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  if (!mongoose.Types.ObjectId.isValid(libroId)) {
    return res.status(400).json({ message: 'Formato de ID de libro inválido' });
  }

  try {
    const actorUser = await Usuario.findById(usuarioId);
    if (!actorUser) {
      return sendError(res, 'Usuario no encontrado', 'Not Found', 404);
    }

    const libro = await Libro.findById(libroId);
    if (!libro) {
      return sendError(res, 'Libro no encontrado', 'Not Found', 404);
    }

    // Check if already favorite before action
    const isAlreadyFavorite = await UsuarioService.isFavorito(usuarioId, libroId);

    const result = await UsuarioService.toggleFavorito(usuarioId, libroId);
    if (!result) {
      return sendError(res, 'No se pudo actualizar favoritos', 'Not Found', 404);
    }

    // Send push notification if it was NOT a favorite before and owner is not the actor
    if (!isAlreadyFavorite && libro.owner && libro.owner.toString() !== usuarioId) {
      const recipient = await Usuario.findById(libro.owner);
      if (recipient) {
        await sendPushNotification({
          recipient,
          title: 'Nuevo favorito',
          body: `${actorUser.name} ha añadido tu libro a favoritos`,
          data: {
            type: 'book_favorite',
            actorId: usuarioId,
            targetId: libroId,
            bookId: libroId,
          },
        });
      }
    }

    return sendSuccess(res, result.favoritos, 'Favoritos actualizados con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al actualizar favoritos');
  }
};

const updatePushToken = async (req: Request, res: Response, next: NextFunction) => {
  const usuarioId = req.userId;
  const { expoPushToken } = req.body;

  if (!usuarioId) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  try {
    const updatedUsuario = await Usuario.findByIdAndUpdate(
      usuarioId,
      { expoPushToken },
      { new: true },
    );

    if (!updatedUsuario) {
      return sendError(res, 'Usuario no encontrado', 'Not Found', 404);
    }

    return sendSuccess(
      res,
      { expoPushToken: updatedUsuario.expoPushToken },
      'Token push actualizado con éxito',
    );
  } catch (error) {
    return sendError(res, error, 'Error al actualizar el token push');
  }
};

const enableNotifications = async (req: Request, res: Response, next: NextFunction) => {
  const { usuarioId } = req.params;
  const currentUserId = req.userId;

  if (!currentUserId) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    return res.status(400).json({ message: 'Formato de ID de usuario inválido' });
  }

  if (currentUserId === usuarioId) {
    return res.status(400).json({ message: 'No puedes activar notificaciones para ti mismo' });
  }

  try {
    const currentUser = await Usuario.findById(currentUserId);
    if (!currentUser) {
      return sendError(res, 'Usuario no encontrado', 'Not Found', 404);
    }

    const following = (currentUser.followingUsers || []).map((id: any) => id.toString());
    if (!following.includes(usuarioId)) {
      return res
        .status(400)
        .json({ message: 'Debes seguir al usuario para poder activar sus notificaciones' });
    }

    await Usuario.findByIdAndUpdate(currentUserId, {
      $addToSet: { notificationUsersEnabled: usuarioId },
    });

    return sendSuccess(res, { enabled: true }, 'Notificaciones activadas con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al activar notificaciones');
  }
};

const disableNotifications = async (req: Request, res: Response, next: NextFunction) => {
  const { usuarioId } = req.params;
  const currentUserId = req.userId;

  if (!currentUserId) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    return res.status(400).json({ message: 'Formato de ID de usuario inválido' });
  }

  try {
    await Usuario.findByIdAndUpdate(currentUserId, {
      $pull: { notificationUsersEnabled: usuarioId },
    });

    return sendSuccess(res, { enabled: false }, 'Notificaciones desactivadas con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al desactivar notificaciones');
  }
};

const getNotificationStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { usuarioId } = req.params;
  const currentUserId = req.userId;

  if (!currentUserId) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    return res.status(400).json({ message: 'Formato de ID de usuario inválido' });
  }

  try {
    const currentUser = await Usuario.findById(currentUserId);
    if (!currentUser) {
      return sendError(res, 'Usuario no encontrado', 'Not Found', 404);
    }

    const enabled = (currentUser.notificationUsersEnabled || [])
      .map((id: any) => id.toString())
      .includes(usuarioId);

    return sendSuccess(res, { enabled }, 'Consulta de estado de notificaciones exitosa');
  } catch (error) {
    return sendError(res, error, 'Error al consultar estado de notificaciones');
  }
};

const getFavoritos = async (req: Request, res: Response, next: NextFunction) => {
  const usuarioId = req.userId;

  if (!usuarioId) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  try {
    const usuario = await UsuarioService.getFavoritos(usuarioId);
    if (!usuario) {
      return sendError(res, 'Usuario no encontrado', 'Not Found', 404);
    }
    return sendSuccess(res, usuario.favoritos, 'Libros favoritos recuperados con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar libros favoritos');
  }
};

const checkFavorito = async (req: Request, res: Response, next: NextFunction) => {
  const { libroId } = req.params;
  const usuarioId = req.userId;

  if (!usuarioId) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  if (!mongoose.Types.ObjectId.isValid(libroId)) {
    return res.status(400).json({ message: 'Formato de ID de libro inválido' });
  }

  try {
    const isFavorite = await UsuarioService.isFavorito(usuarioId, libroId);
    return sendSuccess(res, { isFavorite }, 'Comprobación de favorito exitosa');
  } catch (error) {
    return sendError(res, error, 'Error al comprobar favorito');
  }
};

export default {
  createUsuario,
  getUsuario,
  getFollowers,
  getAllUsuarios,
  getAllUsuarios_NOT_Deleted,
  updateUsuario,
  deleteUsuario,
  permanentDeleteUsuario,
  restoreUsuario,
  searchUsuarioByName,
  toggleWishlist,
  toggleFavorite,
  toggleFavorito,
  getFavoritos,
  checkFavorito,
  updatePushToken,
  enableNotifications,
  disableNotifications,
  getNotificationStatus,
};
