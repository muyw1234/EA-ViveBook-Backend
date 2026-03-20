import mongoose from 'mongoose';
import Libro, { ILibroModel, ILibro } from '../models/Libro';
import { callGoogleApi } from './Util';
import Logging from '../library/Logging';
import Autor from './Autor';

export async function createLibro(data: Partial<ILibro>): Promise<ILibro | null> {
    const libro = new Libro({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    return await libro.save();
}
export async function createLibroByIsbn(isbn: string): Promise<ILibro | null> {
    let data: ILibro = await callGoogleApi(isbn);
    //Logging.info(`Libro found: ${JSON.stringify(data)}`);
    let autores = [];
    // Busca el autor
    for (const name of data.authors as string[]) {
        Logging.log(`Nombre: ${name}`);
        let l_autor = await Autor.getByName(name);
        if (!l_autor) l_autor = await Autor.createAutor({ fullName: name }); // si no existe el autor, lo creamos
        autores.push(l_autor._id);
    }
    data.authors = autores;
    const libro = new Libro({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    return (await libro.save()).populate('authors');
}

export async function getLibro(id: string): Promise<ILibro | null> {
    return await Libro.findById(id).populate('authors', 'fullName');
}

export async function getAllLibros(): Promise<ILibro[] | []> {
    return await Libro.find().populate('authors', 'fullName');
}

export async function getAllLibros_NOT_Deleted(): Promise<ILibro[] | []> {
    return await Libro.find({ IsDeleted: false }).populate('authors', 'fullName');
}

export async function updateLibro(id: string, data: ILibro): Promise<ILibro | null> {
    return await Libro.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteLibro(id: string): Promise<ILibro | null> {
    return await Libro.findByIdAndDelete(id);
}

export async function getLibroByIsbn(isbn: string): Promise<ILibro | null> {
    return await Libro.findOne({ isbn: isbn });
}

export default { createLibro, createLibroByIsbn, getLibro, getAllLibros, getAllLibros_NOT_Deleted, updateLibro, deleteLibro, getLibroByIsbn };
