import mongoose from 'mongoose';
import Organizacion, { IOrganizacionModel, IOrganizacion } from '../models/Organizacion';
import Usuario from '../models/Usuario';

const createOrganizacion = async (data: Partial<IOrganizacion>): Promise<IOrganizacionModel> => {
    const organizacion = new Organizacion({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    return await organizacion.save();
};

// Obtener org por ID con usuarios poblados - retorna objeto JS plano (.lean())
const getOrganizacion = async (organizacionId: string): Promise<any> => {
    return await Organizacion.findById(organizacionId).populate('usuarios').lean();
};

// Obtener todas las organizaciones con usuarios poblados
const getAllOrganizaciones = async (): Promise<any[]> => {
    return await Organizacion.find().populate('usuarios').lean();
};

const updateOrganizacion = async (organizacionId: string, data: Partial<IOrganizacion>): Promise<IOrganizacionModel | null> => {
    const organizacion = await Organizacion.findById(organizacionId);
    if (organizacion) {
        organizacion.set(data);
        return await organizacion.save();
    }
    return null;
};

const deleteOrganizacion = async (organizacionId: string): Promise<IOrganizacionModel | null> => {
    // El pre-delete middleware se ejecuta automáticamente aquí
    // Antes de borrar la org, elimina todos sus usuarios
    return await Organizacion.findByIdAndDelete(organizacionId);
};

/**
 * NUEVO SERVICIO: Obtener usuarios de una organización específica
 * 
 * Este es el servicio que alimenta al nuevo endpoint:
 * GET /organizaciones/:organizacionId/usuarios
 * 
 * Lógica:
 * - Busca TODOS los documentos de Usuario donde organizacion == el ID pasado
 * - .lean() para optimizar performance
 * - Retorna array de usuarios filtrados
 */
const getUsuariosPorOrganizacion = async (organizacionId: string): Promise<any[]> => {
    // find({ organizacion: organizacionId }) = filtrar por organización
    // .lean() = retornar como objeto JS plano
    return await Usuario.find({ organizacion: organizacionId }).lean();
};

export default { createOrganizacion, getOrganizacion, getAllOrganizaciones, updateOrganizacion, deleteOrganizacion, getUsuariosPorOrganizacion };
