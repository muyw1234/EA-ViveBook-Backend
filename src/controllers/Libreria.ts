import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import LibreriaService from '../services/Libreria';
import { getPaginationParams } from './Pagination';

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
  updateLibreria,
  deleteLibreria,
  restoreLibreria,
};
