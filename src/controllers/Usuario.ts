import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import UsuarioService from '../services/Usuario';

const createUsuario = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const savedUsuario = await UsuarioService.createUsuario(req.body);
        return res.status(201).json(savedUsuario);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getUsuario = async (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = req.params.usuarioId;
    try {
        const usuario = await UsuarioService.getUsuario(usuarioId);
        return usuario ? res.status(200).json(usuario) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getAllUsuarios = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const usuarios = await UsuarioService.getAllUsuarios();
        return res.status(200).json(usuarios);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getAllUsuarios_NOT_Deleted = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const usuarios = await UsuarioService.getAllUsuarios_NOT_Deleted();
        return res.status(200).json(usuarios);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateUsuario = async (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = req.params.usuarioId;
    try {
        const updatedUsuario = await UsuarioService.updateUsuario(usuarioId, req.body);
        return updatedUsuario ? res.status(200).json(updatedUsuario) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const deleteUsuario = async (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = req.params.usuarioId;
    try {
        const usuario = await UsuarioService.deleteUsuario(usuarioId);
        return usuario ? res.status(201).json(usuario) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const restoreUsuario = async (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = req.params.usuarioId;
    try {        
        const usuario = await UsuarioService.restoreUsuario(usuarioId);
        return usuario ? res.status(200).json(usuario) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

export default { createUsuario, getUsuario, getAllUsuarios, getAllUsuarios_NOT_Deleted, updateUsuario, deleteUsuario, restoreUsuario };
