import mongoose from 'mongoose';
import Usuario, { IUsuarioModel, IUsuario } from '../models/Usuario';

const createUsuario = async (data: Partial<IUsuario>): Promise<IUsuarioModel> => {
    const usuario = new Usuario({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    return await usuario.save();
};

const getUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findById(usuarioId).populate('libros', 'title');
};

const getUsuarioByEmail = async (theEmail: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findOne({ email: theEmail });
};

const getAllUsuarios = async (): Promise<IUsuarioModel[]> => {
    return await Usuario.find().populate('libros', 'title');
};

const getAllUsuarios_NOT_Deleted = async (): Promise<IUsuarioModel[]> => {
    return await Usuario.find({ IsDeleted: false }).populate('libros', 'title');
};

const updateUsuario = async (usuarioId: string, data: Partial<IUsuario>): Promise<IUsuarioModel | null> => {
    const usuario = await Usuario.findById(usuarioId);
    if (usuario) {
        usuario.set(data);
        return await usuario.save();
    }
    return null;
};

const deleteUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findByIdAndDelete(usuarioId);
};

const restoreUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findByIdAndUpdate(usuarioId, { IsDeleted: false }, { new: true });
};

export default { createUsuario, getUsuario, getAllUsuarios, getUsuarioByEmail, getAllUsuarios_NOT_Deleted, updateUsuario, deleteUsuario, restoreUsuario };
