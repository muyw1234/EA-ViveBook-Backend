import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Autor from '../models/Autor';

const createAutor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const autor = new Autor({
            _id: new mongoose.Types.ObjectId(),
            ...req.body
        });
        const savedAutor = await autor.save();
        return res.status(201).json(savedAutor);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getAutor = async (req: Request, res: Response, next: NextFunction) => {
    const autorId = req.params.autorId;
    try {
        const autor = await Autor.findById(autorId);
        return autor ? res.status(200).json(autor) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getAllAutores = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const autores = await Autor.find();
        return res.status(200).json(autores);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateAutor = async (req: Request, res: Response, next: NextFunction) => {
    const autorId = req.params.autorId;
    try {
        const autor = await Autor.findById(autorId);
        if (autor) {
            autor.set(req.body);
            const savedAutor = await autor.save();
            return res.status(201).json(savedAutor);
        } else {
            return res.status(404).json({ message: 'not found' });
        }
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const deleteAutor = async (req: Request, res: Response, next: NextFunction) => {
    const autorId = req.params.autorId;
    try {
        const autor = await Autor.findByIdAndDelete(autorId);
        return autor ? res.status(201).json({ message: 'deleted' }) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

export default { createAutor, getAutor, getAllAutores, updateAutor, deleteAutor };