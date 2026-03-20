import mongoose from 'mongoose';
import Autor, { IAutorModel, IAutor } from '../models/Autor';

// Crear un autor nuevo
const createAutor = async (data: Partial<IAutor>): Promise<IAutorModel> => {
    const autor = new Autor({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    return await autor.save();
};

// Buscar un autor por su ID
const getAutor = async (autorId: string): Promise<IAutorModel | null> => {
    return await Autor.findById(autorId);
};

// Listar todos los autores
const getAllAutores = async (): Promise<IAutorModel[]> => {
    return await Autor.find();
};

const getAllAutores_NOT_Deleted = async (): Promise<IAutorModel[]> => {
    return await Autor.find({ IsDeleted: false });
};

// Actualizar los datos de un autor
const updateAutor = async (autorId: string, data: Partial<IAutor>): Promise<IAutorModel | null> => {
    const autor = await Autor.findById(autorId);
    if (autor) {
        autor.set(data);
        return await autor.save();
    }
    return null;
};

// Borrar un autor (elimina de la DB)
const deleteAutor = async (autorId: string): Promise<IAutorModel | null> => {
    return await Autor.findByIdAndDelete(autorId);
};

async function getByName(fullName: string): Promise<IAutorModel | null> {
    return await Autor.findOne({ fullName: fullName });
}

export default { createAutor, getAutor, getAllAutores, getAllAutores_NOT_Deleted, updateAutor, deleteAutor, getByName };
