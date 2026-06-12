import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import LibreriaService from '../services/Libreria';
import { getPaginationParams, getQueryBoolean } from './Pagination';
import { sendError, sendSuccess } from '../library/ApiResponse';

const createLibreria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const libreria = await LibreriaService.createLibreria(req.body);
    return res.status(201).json(libreria);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const getLibreria = async (req: Request, res: Response, next: NextFunction) => {
  const libreriaId = req.params.libreriaId;
  try {
    const libreria = await LibreriaService.getLibreria(libreriaId);
    return libreria
      ? res.status(200).json(libreria)
      : res.status(404).json({ message: 'not found' });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const getAllLibrerias = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const librerias = await LibreriaService.getAllLibrerias(page, limit);
    return res.status(200).json(librerias);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const getAdminLibrerias = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const includeDeleted = getQueryBoolean(req.query.includeDeleted, true);
    const librerias = await LibreriaService.getAdminLibrerias({
      page,
      limit,
      search,
      includeDeleted,
    });

    return sendSuccess(res, librerias, 'Listado administrativo de librerías obtenido con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar el listado administrativo de librerías');
  }
};

const createAdminLibreria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const libreria = await LibreriaService.createLibreria(req.body);
    return sendSuccess(res, libreria, 'Librería creada desde el BackOffice', 201);
  } catch (error) {
    return sendError(res, error, 'No se pudo crear la librería desde el BackOffice');
  }
};

const getAdminLibreria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const libreria = await LibreriaService.getLibreria(req.params.libreriaId);
    if (!libreria) {
      return sendError(res, 'La librería solicitada no existe', 'Not Found', 404);
    }
    return sendSuccess(res, libreria, 'Librería obtenida con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al recuperar la librería');
  }
};

const updateAdminLibreria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const libreria = await LibreriaService.updateLibreria(req.params.libreriaId, req.body);
    if (!libreria) {
      return sendError(res, 'No se encontró la librería para actualizar', 'Not Found', 404);
    }
    return sendSuccess(res, libreria, 'Librería actualizada con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al actualizar la librería');
  }
};

const deactivateAdminLibreria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const libreria = await LibreriaService.setLibreriaDeleted(req.params.libreriaId, true);
    if (!libreria) {
      return sendError(res, 'No se encontró la librería para desactivar', 'Not Found', 404);
    }
    return sendSuccess(res, libreria, 'Librería desactivada con éxito');
  } catch (error) {
    return sendError(res, error, 'Error al desactivar la librería');
  }
};

const setAdminLibreriaStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const libreria = await LibreriaService.setLibreriaDeleted(
      req.params.libreriaId,
      req.body.IsDeleted,
    );
    if (!libreria) {
      return sendError(res, 'No se encontró la librería para cambiar su estado', 'Not Found', 404);
    }
    return sendSuccess(
      res,
      libreria,
      libreria.IsDeleted ? 'Librería desactivada con éxito' : 'Librería activada con éxito',
    );
  } catch (error) {
    return sendError(res, error, 'Error al cambiar el estado de la librería');
  }
};

const updateLibreria = async (req: Request, res: Response, next: NextFunction) => {
  const libreriaId = req.params.libreriaId;
  try {
    const libreria = await LibreriaService.updateLibreria(libreriaId, req.body);
    if (libreria) {
      return res.status(201).json(libreria);
    } else {
      return res.status(404).json({ message: 'not found' });
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const deleteLibreria = async (req: Request, res: Response, next: NextFunction) => {
  const libreriaId = req.params.libreriaId;
  try {
    const libreria = await LibreriaService.deleteLibreria(libreriaId);
    return libreria
      ? res.status(201).json(libreria)
      : res.status(404).json({ message: 'not found' });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const restoreLibreria = async (req: Request, res: Response, next: NextFunction) => {
  const libreriaId = req.params.libreriaId;
  try {
    const libreria = await LibreriaService.restoreLibreria(libreriaId);
    return libreria
      ? res.status(200).json(libreria)
      : res.status(404).json({ message: 'not found' });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

export default {
  createLibreria,
  getLibreria,
  getAllLibrerias,
  getAdminLibrerias,
  createAdminLibreria,
  getAdminLibreria,
  updateAdminLibreria,
  deactivateAdminLibreria,
  setAdminLibreriaStatus,
  updateLibreria,
  deleteLibreria,
  restoreLibreria,
};
