import { NextFunction, Request, Response } from 'express';
import AutorService from '../services/Autor';
import { getPaginationParams, getQueryBoolean } from './Pagination';
import { sendSuccess, sendError } from '../library/ApiResponse';

// Maneja la creación de un nuevo autor
const createAutor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const savedAutor = await AutorService.createAutor(req.body);
    return sendSuccess(res, savedAutor, 'Autor creado con éxito', 201);
  } catch (error) {
    // Si falta un campo obligatorio o el formato de datos es inválido, devolverá un 400 detallado
    return sendError(res, error, 'No se pudo registrar el autor');
  }
};

// Obtiene un autor por ID
const getAutor = async (req: Request, res: Response, next: NextFunction) => {
  const autorId = req.params.autorId;
  try {
    const autor = await AutorService.getAutor(autorId);
    if (!autor) {
      return sendError(res, 'El autor solicitado no existe', 'Not Found', 404);
    }
    return sendSuccess(res, autor, 'Autor obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al procesar la búsqueda del autor');
  }
};

// Devuelve la lista completa de autores
const getAllAutores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const autores = await AutorService.getAllAutores(page, limit);
    return sendSuccess(res, autores, 'Listado de autores obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar la lista de autores');
  }
};

// Devuelve la lista completa de autores no eliminados
const getAllAutores_NOT_Deleted = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const autores = await AutorService.getAllAutores_NOT_Deleted(page, limit);
    return sendSuccess(res, autores, 'Listado de autores activos obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar los autores activos');
  }
};

const getAdminAutores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const includeDeleted = getQueryBoolean(req.query.includeDeleted, true);
    const autores = await AutorService.getAdminAutores({
      page,
      limit,
      search,
      includeDeleted,
    });

    return sendSuccess(res, autores, 'Listado administrativo de autores obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar el listado administrativo de autores');
  }
};

// Actualiza los datos de un autor existente
const updateAutor = async (req: Request, res: Response, next: NextFunction) => {
  const autorId = req.params.autorId;
  try {
    const savedAutor = await AutorService.updateAutor(autorId, req.body);
    if (!savedAutor) {
      return sendError(res, 'No se encontró el autor para actualizar', 'Not Found', 404);
    }
    return sendSuccess(res, savedAutor, 'Autor actualizado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al intentar actualizar el autor');
  }
};

// Elimina un autor por su ID
const deleteAutor = async (req: Request, res: Response, next: NextFunction) => {
  const autorId = req.params.autorId;
  try {
    const deletedAutor = await AutorService.deleteAutor(autorId);
    if (!deletedAutor) {
      return sendError(res, 'No se encontró el autor para eliminar', 'Not Found', 404);
    }
    return sendSuccess(res, deletedAutor, 'Autor eliminado permanentemente con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al intentar eliminar el autor');
  }
};

const restoreAutor = async (req: Request, res: Response, next: NextFunction) => {
  const autorId = req.params.autorId;
  try {
    const autor = await AutorService.restoreAutor(autorId);
    if (!autor) {
      return sendError(res, 'No se encontró el autor para restaurar', 'Not Found', 404);
    }
    return sendSuccess(res, autor, 'Autor restaurado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al intentar restaurar el autor');
  }
};

const deactivateAutor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const autor = await AutorService.setAutorDeleted(req.params.autorId, true);

    if (!autor) {
      return sendError(res, 'No se encontró el autor para desactivar', 'Not Found', 404);
    }

    return sendSuccess(res, autor, 'Autor desactivado con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al desactivar el autor');
  }
};

const setAutorStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const autor = await AutorService.setAutorDeleted(req.params.autorId, req.body.IsDeleted);

    if (!autor) {
      return sendError(res, 'No se encontró el autor para cambiar su estado', 'Not Found', 404);
    }

    const message = autor.IsDeleted ? 'Autor desactivado con éxito' : 'Autor activado con éxito';
    return sendSuccess(res, autor, message);
  } catch (error) {
    return sendError(res, error, 'Error al cambiar el estado del autor');
  }
};

export default {
  createAutor,
  getAutor,
  getAllAutores,
  getAllAutores_NOT_Deleted,
  getAdminAutores,
  updateAutor,
  deleteAutor,
  restoreAutor,
  deactivateAutor,
  setAutorStatus,
};
