import mongoose from 'mongoose';
import Libro, { ILibroModel, ILibro } from '../models/Libro';
import { callOpenLibraryBookApi } from './Util';
import Logging from '../library/Logging';
import Autor from './Autor';

export async function createLibro(data: Partial<ILibro>): Promise<ILibro | null> {
    let autores = [];
    if (data.authors && Array.isArray(data.authors)) {
        for (const author of data.authors) {
            // Si es un string y NO es un ObjectId válido, lo tratamos como un nombre completo
            if (typeof author === 'string' && !mongoose.Types.ObjectId.isValid(author)) {
                let l_autor = await Autor.getByName(author);
                if (!l_autor) l_autor = await Autor.createAutor({ fullName: author });
                autores.push(l_autor._id);
            } else {
                autores.push(author);
            }
        }
        data.authors = autores;
    }

    const libro = new Libro({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    return await libro.save();
}
export async function createLibroByIsbn(isbn: string): Promise<ILibroModel | null> {
    // Primero comprobamos que el libro existe o no. No poner esto al principio no me daba error, pero es por si acaso.
    let isFound = await getLibroByIsbn(isbn);
    if (isFound !== null) return isFound;
    // Si no existe entonces lo creamos.
    let data: ILibro = await callOpenLibraryBookApi(isbn);
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

export async function restoreLibro(libroId: string): Promise<ILibro | null> {
    return await Libro.findByIdAndUpdate(libroId, { IsDeleted: false }, { new: true });
}

export async function getLibroByIsbn(isbn: string): Promise<ILibroModel | null> {
    return await Libro.findOne({ isbn: isbn });
}

export default { createLibro, createLibroByIsbn, getLibro, getAllLibros, getAllLibros_NOT_Deleted, updateLibro, deleteLibro, restoreLibro, getLibroByIsbn };
