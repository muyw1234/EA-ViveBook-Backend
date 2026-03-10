import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import OrganizacionService from '../services/Organizacion';

const createOrganizacion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const savedOrganizacion = await OrganizacionService.createOrganizacion(req.body);
        return res.status(201).json(savedOrganizacion);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readOrganizacion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizacion = await OrganizacionService.getOrganizacion(req.params.organizacionId);
        return organizacion ? res.status(200).json(organizacion) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizaciones = await OrganizacionService.getAllOrganizaciones();
        return res.status(200).json(organizaciones);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateOrganizacion = async (req: Request, res: Response, next: NextFunction) => {
    const organizacionId = req.params.organizacionId;

    try {
        const organizacion = await OrganizacionService.updateOrganizacion(organizacionId, req.body);
        return organizacion ? res.status(200).json(organizacion) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const deleteOrganizacion = async (req: Request, res: Response, next: NextFunction) => {
    const organizacionId = req.params.organizacionId;

    try {
        const organizacion = await OrganizacionService.deleteOrganizacion(organizacionId);
        return organizacion ? res.status(201).json(organizacion) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

// NUEVO: obtener usuarios por organización (requisito #3)
const readUsuariosPorOrganizacion = async (req: Request, res: Response, next: NextFunction) => {
    const organizacionId = req.params.organizacionId;
    
    try {
        // Validar que existe la org
        const organizacion = await OrganizacionService.getOrganizacion(organizacionId);
        if (!organizacion) {
            return res.status(404).json({ message: 'Organización no encontrada' });
        }
        // Obtener usuarios filtrados
        const usuarios = await OrganizacionService.getUsuariosPorOrganizacion(organizacionId);
        return res.status(200).json(usuarios);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

export default { createOrganizacion, readOrganizacion, readAll, updateOrganizacion, deleteOrganizacion, readUsuariosPorOrganizacion };
