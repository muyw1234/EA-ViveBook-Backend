import mongoose, { FilterQuery } from 'mongoose';
import Autor, { IAutorModel, IAutor } from '../models/Autor';
import { getPagination, PaginatedResult } from './Pagination';

export type AdminAutorQuery = {
  page?: number;
  limit?: number;
  search?: string;
  includeDeleted?: boolean;
};

// Crear un autor nuevo
const createAutor = async (data: Partial<IAutor>): Promise<IAutorModel> => {
  const autor = new Autor({
    _id: new mongoose.Types.ObjectId(),
    ...data,
  });
  return await autor.save();
};

// Buscar un autor por su ID
const getAutor = async (autorId: string): Promise<IAutorModel | null> => {
  return await Autor.findById(autorId);
};

// Listar todos los autores
const getAllAutores = async (page = 1, limit = 10): Promise<PaginatedResult<IAutorModel>> => {
  const pagination = getPagination(page, limit);
  const [data, total] = await Promise.all([
    Autor.find().sort({ _id: 1 }).skip(pagination.skip).limit(pagination.limit),
    Autor.countDocuments(),
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
};

const getAllAutores_NOT_Deleted = async (
  page = 1,
  limit = 10,
): Promise<PaginatedResult<IAutorModel>> => {
  const pagination = getPagination(page, limit);
  const filter = { IsDeleted: false };
  const [data, total] = await Promise.all([
    Autor.find(filter).sort({ _id: 1 }).skip(pagination.skip).limit(pagination.limit),
    Autor.countDocuments(filter),
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
};

const getAdminAutores = async ({
  page = 1,
  limit = 10,
  search = '',
  includeDeleted = true,
}: AdminAutorQuery): Promise<PaginatedResult<IAutorModel>> => {
  const pagination = getPagination(page, limit);
  const filter: FilterQuery<IAutorModel> = {};
  const normalizedSearch = search.trim();

  if (!includeDeleted) {
    filter.IsDeleted = false;
  }

  if (normalizedSearch) {
    filter.fullName = {
      $regex: normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      $options: 'i',
    };
  }

  const [data, total] = await Promise.all([
    Autor.find(filter).sort({ fullName: 1, _id: 1 }).skip(pagination.skip).limit(pagination.limit),
    Autor.countDocuments(filter),
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

const restoreAutor = async (autorId: string): Promise<IAutorModel | null> => {
  return await Autor.findByIdAndUpdate(autorId, { IsDeleted: false }, { new: true });
};

const setAutorDeleted = async (
  autorId: string,
  isDeleted: boolean,
): Promise<IAutorModel | null> => {
  return await Autor.findByIdAndUpdate(autorId, { IsDeleted: isDeleted }, { new: true });
};

async function getByName(fullName: string): Promise<IAutorModel | null> {
  return await Autor.findOne({ fullName: fullName });
}

export default {
  createAutor,
  getAutor,
  getAllAutores,
  getAllAutores_NOT_Deleted,
  getAdminAutores,
  updateAutor,
  deleteAutor,
  restoreAutor,
  setAutorDeleted,
  getByName,
};
