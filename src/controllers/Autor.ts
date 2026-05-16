import { NextFunction, Request, Response } from 'express';
import AutorService from '../services/Autor';
import { getPaginationParams } from './Pagination';

// Maneja la creación de un nuevo autor
const createAutor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const savedAutor = await AutorService.createAutor(req.body);
    return res.status(201).json(savedAutor);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

// Obtiene un autor por ID
const getAutor = async (req: Request, res: Response, next: NextFunction) => {
  const autorId = req.params.autorId;
  try {
    const autor = await AutorService.getAutor(autorId);
    return autor ? res.status(200).json(autor) : res.status(404).json({ message: 'not found' });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

// Devuelve la lista completa de autores
const getAllAutores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const autores = await AutorService.getAllAutores(page, limit);
    return res.status(200).json(autores);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

// Devuelve la lista completa de autores no eliminados
const getAllAutores_NOT_Deleted = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const autores = await AutorService.getAllAutores_NOT_Deleted(page, limit);
    return res.status(200).json(autores);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

// Actualiza los datos de un autor existente
const updateAutor = async (req: Request, res: Response, next: NextFunction) => {
  const autorId = req.params.autorId;
  try {
    const savedAutor = await AutorService.updateAutor(autorId, req.body);
    if (savedAutor) {
      return res.status(200).json(savedAutor);
    } else {
      return res.status(404).json({ message: 'not found' });
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
};

// Elimina un autor por su ID
const deleteAutor = async (req: Request, res: Response, next: NextFunction) => {
  const autorId = req.params.autorId;
  try {
    const deletedAutor = await AutorService.deleteAutor(autorId);
    return deletedAutor
      ? res.status(201).json({ message: 'deleted' })
      : res.status(404).json({ message: 'not found' });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const restoreAutor = async (req: Request, res: Response, next: NextFunction) => {
  const autorId = req.params.autorId;
  try {
    const autor = await AutorService.restoreAutor(autorId);
    return autor ? res.status(200).json(autor) : res.status(404).json({ message: 'not found' });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

export default {
  createAutor,
  getAutor,
  getAllAutores,
  getAllAutores_NOT_Deleted,
  updateAutor,
  deleteAutor,
  restoreAutor,
};
