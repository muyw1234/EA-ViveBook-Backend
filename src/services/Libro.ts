import mongoose, { FilterQuery } from 'mongoose';
import Libro, { ILibroModel, ILibro } from '../models/Libro';
import Usuario from '../models/Usuario';
import { callOpenLibraryBookApi } from './Util';
import Logging from '../library/Logging';
import Autor from './Autor';
import { getPagination, PaginatedResult } from './Pagination';
import AutorModel from '../models/Autor';

export const adminLibroSearchFields = ['title', 'isbn', 'author', '_id'] as const;
export type AdminLibroSearchField = (typeof adminLibroSearchFields)[number];

export type AdminLibroQuery = {
  page?: number;
  limit?: number;
  search?: string;
  searchField?: AdminLibroSearchField;
  includeDeleted?: boolean;
  type?: ILibro['type'];
  estado?: string;
};

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
  return await Libro.findById(id).populate('authors', 'fullName').populate('owner', 'name');
}

export async function getAllLibros(page = 1, limit = 10): Promise<PaginatedResult<ILibro>> {
  const pagination = getPagination(page, limit);
  const [data, total] = await Promise.all([
    Libro.find()
      .sort({ _id: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('authors', 'fullName')
      .populate('owner', 'name'),
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

async function getActiveUserIds(): Promise<string[]> {
  const activeUsers = await Usuario.find({ IsDeleted: false }).select('_id');
  return activeUsers.map((u) => u._id.toString());
}

export async function getAllLibros_NOT_Deleted(
  page = 1,
  limit = 10,
  excludeOwnerId?: string,
  extraFilters: any = {},
): Promise<PaginatedResult<ILibro>> {
  const pagination = getPagination(page, limit);
  const activeUserIds = await getActiveUserIds();
  const filter: any = { IsDeleted: false, ...extraFilters };

  if (excludeOwnerId && mongoose.Types.ObjectId.isValid(excludeOwnerId)) {
    const filteredActiveUserIds = activeUserIds.filter((id) => id !== excludeOwnerId.toString());
    filter.$or = [{ owner: { $in: filteredActiveUserIds } }, { owner: { $exists: false } }];
  } else {
    filter.$or = [{ owner: { $in: activeUserIds } }, { owner: { $exists: false } }];
  }

  const [data, total] = await Promise.all([
    Libro.find(filter)
      .sort({ _id: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('authors', 'fullName')
      .populate('owner', 'name'),
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

export async function getLibrosByType(
  type: string,
  page = 1,
  limit = 10,
  excludeOwnerId?: string,
): Promise<PaginatedResult<ILibro>> {
  const pagination = getPagination(page, limit);
  const activeUserIds = await getActiveUserIds();
  const filter: any = { type: type, IsDeleted: false };

  if (excludeOwnerId && mongoose.Types.ObjectId.isValid(excludeOwnerId)) {
    const filteredActiveUserIds = activeUserIds.filter((id) => id !== excludeOwnerId.toString());
    filter.$or = [{ owner: { $in: filteredActiveUserIds } }, { owner: { $exists: false } }];
  } else {
    filter.$or = [{ owner: { $in: activeUserIds } }, { owner: { $exists: false } }];
  }

  const [data, total] = await Promise.all([
    Libro.find(filter)
      .sort({ _id: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('authors', 'fullName')
      .populate('owner', 'name'),
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

export async function updateLibro(id: string, data: Partial<ILibro>): Promise<ILibro | null> {
  return await Libro.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteLibro(id: string): Promise<ILibro | null> {
  return await Libro.findByIdAndDelete(id);
}

export async function restoreLibro(libroId: string): Promise<ILibro | null> {
  return await Libro.findByIdAndUpdate(libroId, { IsDeleted: false }, { new: true });
}

export async function setLibroDeleted(libroId: string, isDeleted: boolean): Promise<ILibro | null> {
  return await Libro.findByIdAndUpdate(libroId, { IsDeleted: isDeleted }, { new: true });
}

export async function getLibroByIsbn(isbn: string): Promise<ILibroModel | null> {
  return await Libro.findOne({ isbn: isbn });
}

async function searchLibroByTitle(
  term: string,
  page = 1,
  limit = 10,
  excludeOwnerId?: string,
  extraFilters: any = {},
): Promise<PaginatedResult<ILibroModel>> {
  const filter: any = { $text: { $search: term }, ...extraFilters };

  if (excludeOwnerId && mongoose.Types.ObjectId.isValid(excludeOwnerId)) {
    filter.owner = { $ne: new mongoose.Types.ObjectId(excludeOwnerId) };
  }

  const [data, total] = await Promise.all([
    Libro.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('authors', 'fullName')
      .populate('owner', 'name'),
    Libro.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function buyLibro(libroId: string, userId: string): Promise<boolean> {
  try {
    const libro = await Libro.findById(libroId);
    if (!libro) {
      Logging.error('Book not found in buyLibro');
      return false;
    }
    if (libro.isReserved) {
      Logging.error('Book is reserved and cannot be bought');
      return false;
    }

    // Mark book as deleted (sold)
    const updatedLibro = await Libro.findByIdAndUpdate(libroId, { IsDeleted: true });
    if (!updatedLibro) {
      Logging.error('Book could not be updated in buyLibro');
      return false;
    }

    // Add to user's bought collection
    const updatedUser = await Usuario.findByIdAndUpdate(userId, {
      $push: { boughtLibros: libroId },
    });

    if (!updatedUser) {
      Logging.error('User not found in buyLibro');
      return false;
    }

    return true;
  } catch (error) {
    Logging.error(`Error in buyLibro service: ${error}`);
    return false;
  }
}

export async function rentLibro(libroId: string, userId: string): Promise<boolean> {
  try {
    const libro = await Libro.findById(libroId);
    if (!libro) {
      Logging.error('Book not found in rentLibro');
      return false;
    }
    if (libro.isReserved) {
      Logging.error('Book is reserved and cannot be rented');
      return false;
    }

    // Mark book as deleted (unavailable)
    const updatedLibro = await Libro.findByIdAndUpdate(libroId, { IsDeleted: true });
    if (!updatedLibro) {
      Logging.error('Book could not be updated in rentLibro');
      return false;
    }

    // Add to user's rented collection
    const updatedUser = await Usuario.findByIdAndUpdate(userId, {
      $push: { rentedLibros: libroId },
    });

    if (!updatedUser) {
      Logging.error('User not found in rentLibro');
      return false;
    }

    return true;
  } catch (error) {
    Logging.error(`Error in rentLibro service: ${error}`);
    return false;
  }
}

export default {
  createLibro,
  createLibroByIsbn,
  getLibro,
  getAllLibros,
  getAdminLibros,
  getAllLibros_NOT_Deleted,
  getLibrosByType,
  updateLibro,
  deleteLibro,
  restoreLibro,
  setLibroDeleted,
  getLibroByIsbn,
  searchLibroByTitle,
  buyLibro,
  rentLibro,
};
