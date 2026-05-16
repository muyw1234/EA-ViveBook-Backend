import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import LibroService from '../services/Libro';
import Usuario from '../models/Usuario';
import Logging from '../library/Logging';
import { getPaginationParams } from './Pagination';

const createLibro = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;

    // Add owner to the request body before creating the book
    if (userId) {
      req.body.owner = userId;
    }

    const savedLibro = await LibroService.createLibro(req.body);

    if (savedLibro && userId) {
      const libroId = (savedLibro as any)._id;
      // Update the user's book list
      await Usuario.findByIdAndUpdate(userId, {
        $push: { libros: libroId },
      });
      Logging.info(`Book ${libroId} linked to user ${userId}`);
    } else {
      Logging.warning('Book created but could not link to user (savedLibro or userId missing)');
    }

    return res.status(201).json(savedLibro);
  } catch (error) {
    Logging.error(`Error in createLibro: ${error}`);
    return res.status(500).json({ error });
  }
};

const getLibro = async (req: Request, res: Response, next: NextFunction) => {
  const libroId = req.params.libroId;
  try {
    const libro = await LibroService.getLibro(libroId);
    return libro ? res.status(200).json(libro) : res.status(404).json({ message: 'not found' });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const getAllLibros = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const libros = await LibroService.getAllLibros(page, limit);
    return res.status(200).json(libros);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const getAllLibros_NOT_Deleted = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const libros = await LibroService.getAllLibros_NOT_Deleted(page, limit);
    return res.status(200).json(libros);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const getLibrosByType = async (req: Request, res: Response, next: NextFunction) => {
  const type = req.params.type;
  try {
    const libros = await LibroService.getLibrosByType(type);
    return res.status(200).json(libros);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const updateLibro = async (req: Request, res: Response, next: NextFunction) => {
  const libroId = req.params.libroId;
  try {
    const libro = await LibroService.updateLibro(libroId, req.body);
    if (libro) {
      return res.status(200).json(libro);
    } else {
      return res.status(404).json({ message: 'not found' });
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const deleteLibro = async (req: Request, res: Response, next: NextFunction) => {
  const libroId = req.params.libroId;
  try {
    const libro = await LibroService.deleteLibro(libroId);
    return libro ? res.status(201).json(libro) : res.status(404).json({ message: 'not found' });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const restoreLibro = async (req: Request, res: Response, next: NextFunction) => {
  const libroId = req.params.libroId;
  try {
    const libro = await LibroService.restoreLibro(libroId);
    return libro ? res.status(200).json(libro) : res.status(404).json({ message: 'not found' });
  } catch (error) {
    return res.status(500).json({ error });
  }
};
/** Para testing */
export async function createLibroByIsbn(req: Request, res: Response, next: NextFunction) {
  const isbn = req.params.isbn;

  try {
    const libro = await LibroService.getLibroByIsbn(isbn);
    Logging.info(`Book found: ${libro}`);
    if (libro !== null) return res.status(200).json(libro);
    const libroSaved = await LibroService.createLibroByIsbn(isbn);
    return res.status(201).json(libroSaved);
  } catch (error) {
    return res.status(500).json({ error });
  }
}

async function searchLibroByTitle(req: Request, res: Response, next: NextFunction) {
  const { page, limit } = getPaginationParams(req);
  const term: string = req.query.term as string;
  Logging.info(`Searching the term: ${term}`);

  try {
    const libros = await LibroService.searchLibroByTitle(term, page, limit);
    if (libros.length === 0)
      return res.status(404).json({ message: `The term ${term} was not found` });
    return res.status(200).json(libros);
  } catch (error) {
    return res.status(400).json({ error });
  }
}

export default {
  createLibro,
  getLibro,
  getAllLibros,
  getAllLibros_NOT_Deleted,
  getLibrosByType,
  updateLibro,
  deleteLibro,
  restoreLibro,
  createLibroByIsbn,
  searchLibroByTitle,
};
