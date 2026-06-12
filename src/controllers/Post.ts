import { NextFunction, Request, Response } from 'express';
import { IPost } from '../models/Post';
import PostService from '../services/Post';
import Logging from '../library/Logging';
import { getPaginationParams, getQueryBoolean } from './Pagination';
import { sendSuccess, sendError } from '../library/ApiResponse';

async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const buffer = await PostService.createPost({
      description: req.body.description,
      status: req.body.status,
      imageUrl: req.body.imageUrl,
      IsDeleted: req.body.isDeleted,
      ownerId: req.body.ownerId,
      bookId: req.body.bookId,
    });
    return sendSuccess(res, buffer, 'Post creado con éxito', 201);
  } catch (error) {
    Logging.error(error);
    return sendError(res, error, 'No se pudo crear el post');
  }
}

async function createPostByIsbn(req: Request, res: Response, next: NextFunction) {
  try {
    const buffer = await PostService.createPostByIsbn(req.params.isbn as string, {
      description: req.body.description,
      status: req.body.status,
      imageUrl: req.body.imageUrl,
      IsDeleted: req.body.isDeleted,
      ownerId: req.body.ownerId,
      price: req.body.price,
    });
    return sendSuccess(res, buffer, 'Post creado correctamente mediante ISBN', 201);
  } catch (error) {
    Logging.error(error);
    return sendError(res, error, 'Error al intentar crear el post por ISBN', 400);
  }
}

async function readPost(req: Request, res: Response, next: NextFunction) {
  try {
    const buffer = await PostService.getPostById(req.params.id as string);
    if (buffer === null) {
      return sendError(res, 'El post solicitado no existe', 'Not Found', 404);
    }
    return sendSuccess(res, buffer, 'Post obtenido con éxito');
  } catch (error) {
    Logging.error(error);
    return sendError(res, error, 'Error al procesar la obtención del post');
  }
}

async function readAllPost(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = getPaginationParams(req);
    const buffer = await PostService.getAllPost(page, limit);
    return sendSuccess(res, buffer, 'Listado de posts obtenido con éxito');
  } catch (error) {
    Logging.error(error);
    return sendError(res, error, 'Error al recuperar los posts');
  }
}

async function readAdminPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = getPaginationParams(req);
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const includeDeleted = getQueryBoolean(req.query.includeDeleted, true);
    const allowedStatuses = ['VENTA', 'ALQUILER', 'NO_DISPONIBLE'];
    const status =
      typeof req.query.status === 'string' && allowedStatuses.includes(req.query.status)
        ? req.query.status
        : undefined;
    const posts = await PostService.getAdminPosts({
      page,
      limit,
      search,
      includeDeleted,
      status,
    });
    return sendSuccess(res, posts, 'Listado administrativo de posts obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar el listado administrativo de posts');
  }
}

async function createAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await PostService.createPost(req.body);
    return sendSuccess(res, post, 'Post creado desde el BackOffice', 201);
  } catch (error) {
    return sendError(res, error, 'No se pudo crear el post desde el BackOffice');
  }
}

async function readAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await PostService.getPostById(req.params.id);
    if (!post) return sendError(res, 'El post solicitado no existe', 'Not Found', 404);
    return sendSuccess(res, post, 'Post obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar el post');
  }
}

async function updateAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await PostService.updatePost(req.params.id, req.body);
    if (!post) return sendError(res, 'No se encontró el post para actualizar', 'Not Found', 404);
    return sendSuccess(res, post, 'Post actualizado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al actualizar el post');
  }
}

async function deactivateAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await PostService.setPostDeleted(req.params.id, true);
    if (!post) return sendError(res, 'No se encontró el post para desactivar', 'Not Found', 404);
    return sendSuccess(res, post, 'Post desactivado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al desactivar el post');
  }
}

async function setAdminPostStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await PostService.setPostDeleted(req.params.id, req.body.IsDeleted);
    if (!post) {
      return sendError(res, 'No se encontró el post para cambiar su estado', 'Not Found', 404);
    }
    return sendSuccess(
      res,
      post,
      post.IsDeleted ? 'Post desactivado con éxito' : 'Post activado con éxito',
    );
  } catch (error) {
    return sendError(res, error, 'Error al cambiar el estado del post');
  }
}

async function updatePost(req: Request, res: Response, next: NextFunction) {
  try {
    const data = {
      description: req.body.description,
      status: req.body.status,
      imageUrl: req.body.imageUrl,
      IsDeleted: req.body.isDeleted,
      ownerId: req.body.ownerId,
      bookId: req.body.bookId,
      price: req.body.price,
    };
    const buffer = await PostService.updatePost(req.params.id as string, data);
    if (!buffer) {
      return sendError(res, 'No se encontró el post para actualizar', 'Not Found', 404);
    }
    return sendSuccess(res, buffer, 'Post actualizado con éxito');
  } catch (error) {
    Logging.error(error);
    return sendError(res, error, 'Error al intentar actualizar el post');
  }
}

async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    const buffer = await PostService.deletePost(req.params.id as string);
    if (!buffer) {
      return sendError(res, 'No se encontró el post para eliminar', 'Not Found', 404);
    }
    return sendSuccess(res, buffer, 'Post eliminado de la base de datos con éxito');
  } catch (error) {
    Logging.error(error);
    return sendError(res, error, 'Error al intentar eliminar el post');
  }
}

async function searchPostByTerm(req: Request, res: Response, next: NextFunction) {
  const { page, limit } = getPaginationParams(req);
  const term: string = req.query.term as string;
  Logging.info(`Searching the term: ${term}`);

  try {
    const posts = await PostService.searchPostByterm(term, page, limit);
    if (posts.length === 0) {
      return sendError(res, `No se encontraron posts con el término: ${term}`, 'Not Found', 404);
    }
    return sendSuccess(res, posts, 'Búsqueda de posts realizada con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al procesar la búsqueda de posts');
  }
}

export default {
  createPost,
  createPostByIsbn,
  readPost,
  readAllPost,
  readAdminPosts,
  createAdminPost,
  readAdminPost,
  updateAdminPost,
  deactivateAdminPost,
  setAdminPostStatus,
  updatePost,
  deletePost,
  searchPostByTerm,
};
