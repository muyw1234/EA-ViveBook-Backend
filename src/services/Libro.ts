import mongoose from 'mongoose';
import Libro, { ILibroModel, ILibro } from '../models/Libro';
import { callOpenLibraryBookApi } from './Util';
import Logging from '../library/Logging';
import Autor from './Autor';
import { getPagination, PaginatedResult } from './Pagination';

export async function createLibro(data: Partial<ILibro>): Promise<ILibro | null> {
  const autores = [];
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
    ...data,
  });
  return await libro.save();
}
export async function createLibroByIsbn(isbn: string): Promise<ILibroModel | null> {
  // Primero comprobamos que el libro existe o no. No poner esto al principio no me daba error, pero es por si acaso.
  const isFound = await getLibroByIsbn(isbn);
  if (isFound !== null) return isFound;
  // Si no existe entonces lo creamos.
  const data: ILibro = await callOpenLibraryBookApi(isbn);
  //Logging.info(`Libro found: ${JSON.stringify(data)}`);
  const autores = [];
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
    ...data,
  });
  return (await libro.save()).populate('authors');
}

export async function getLibro(id: string): Promise<ILibro | null> {
  return await Libro.findById(id).populate('authors', 'fullName');
}

export async function getAllLibros(page = 1, limit = 10): Promise<PaginatedResult<ILibro>> {
  const pagination = getPagination(page, limit);
  const [data, total] = await Promise.all([
    Libro.find()
      .sort({ _id: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('authors', 'fullName'),
    Libro.countDocuments(),
  ]);

  return {
    data,
    pagination: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function getAllLibros_NOT_Deleted(
  page = 1,
  limit = 10,
): Promise<PaginatedResult<ILibro>> {
  const pagination = getPagination(page, limit);
  const filter = { IsDeleted: false };
  const [data, total] = await Promise.all([
    Libro.find(filter)
      .sort({ _id: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('authors', 'fullName'),
    Libro.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function getLibrosByType(type: string): Promise<ILibro[] | []> {
  return await Libro.find({ type: type, IsDeleted: false }).populate('authors', 'fullName');
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

async function searchLibroByTitle(term: string, page = 1, limit = 10): Promise<ILibroModel[] | []> {
  // return await Libro.find({ title: { $regex: `${term}` } }) // Esto es con expresiones regulares. El profe recomienda hacerlo por index text. https://medium.com/the-tech-bible/how-to-do-full-text-search-in-mongodb-using-mongoose-28e868092dd7
  return await Libro.find({ $text: { $search: term } })
    .limit(limit)
    .skip((page - 1) * limit); // saltarte los terminos que ya has visto
}

export default {
  createLibro,
  createLibroByIsbn,
  getLibro,
  getAllLibros,
  getAllLibros_NOT_Deleted,
  getLibrosByType,
  updateLibro,
  deleteLibro,
  restoreLibro,
  getLibroByIsbn,
  searchLibroByTitle,
};
