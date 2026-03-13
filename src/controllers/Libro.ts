import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Libro from '../models/Libro';

const createLibro = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const libro = new Libro({
            _id: new mongoose.Types.ObjectId(),
            ...req.body
        });
        const savedLibro = await libro.save();
        return res.status(201).json(savedLibro);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getLibro = async (req: Request, res: Response, next: NextFunction) => {
    const libroId = req.params.libroId;
    try {
        const libro = await Libro.findById(libroId).populate('author owner libreria');
        return libro ? res.status(200).json(libro) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getAllLibros = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const libros = await Libro.find().populate('author owner libreria');
        return res.status(200).json(libros);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateLibro = async (req: Request, res: Response, next: NextFunction) => {
    const libroId = req.params.libroId;
    try {
        const libro = await Libro.findById(libroId);
        if (libro) {
            libro.set(req.body);
            const savedLibro = await libro.save();
            return res.status(201).json(savedLibro);
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
        const libro = await Libro.findByIdAndDelete(libroId);
        return libro ? res.status(201).json({ message: 'deleted' }) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

export default { createLibro, getLibro, getAllLibros, updateLibro, deleteLibro };