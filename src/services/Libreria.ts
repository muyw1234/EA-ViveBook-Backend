import mongoose, { FilterQuery } from 'mongoose';
import Libreria, { ILibreriaModel, ILibreria } from '../models/Libreria';
import { getPagination, PaginatedResult } from './Pagination';

export const adminLibreriaSearchFields = ['name', 'address', '_id'] as const;
export type AdminLibreriaSearchField = (typeof adminLibreriaSearchFields)[number];

export type AdminLibreriaQuery = {
  page?: number;
  limit?: number;
  search?: string;
  searchField?: AdminLibreriaSearchField;
  includeDeleted?: boolean;
};

const migrateLegacyDeletedFlag = async (): Promise<void> => {
  await Libreria.collection.updateMany({ isDeleted: { $exists: true } }, [
    {
      $set: {
        IsDeleted: { $ifNull: ['$IsDeleted', '$isDeleted'] },
      },
    },
    { $unset: 'isDeleted' },
  ]);
};

const createLibreria = async (data: Partial<ILibreria>): Promise<ILibreriaModel> => {
  const libreria = new Libreria({
    _id: new mongoose.Types.ObjectId(),
    ...data,
  });
  return await libreria.save();
};

const getLibreria = async (libreriaId: string): Promise<ILibreriaModel | null> => {
  return await Libreria.findById(libreriaId);
};

const getAllLibrerias = async (page = 1, limit = 10): Promise<PaginatedResult<ILibreriaModel>> => {
  const pagination = getPagination(page, limit);
  const [data, total] = await Promise.all([
    Libreria.find().sort({ _id: 1 }).skip(pagination.skip).limit(pagination.limit),
    Libreria.countDocuments(),
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

const getAdminLibrerias = async ({
  page = 1,
  limit = 10,
  search = '',
  searchField = 'name',
  includeDeleted = true,
}: AdminLibreriaQuery): Promise<PaginatedResult<ILibreriaModel>> => {
  await migrateLegacyDeletedFlag();
  const pagination = getPagination(page, limit);
  const filter: FilterQuery<ILibreriaModel> = {};
  const normalizedSearch = search.trim();

  if (!includeDeleted) {
    filter.IsDeleted = false;
  }

  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    switch (searchField) {
      case 'address':
        filter.address = { $regex: escapedSearch, $options: 'i' };
        break;
      case '_id':
        filter._id = mongoose.Types.ObjectId.isValid(normalizedSearch)
          ? new mongoose.Types.ObjectId(normalizedSearch)
          : { $exists: false };
        break;
      case 'name':
      default:
        filter.name = { $regex: escapedSearch, $options: 'i' };
        break;
    }
  }

  const [data, total] = await Promise.all([
    Libreria.find(filter)
      .sort({ name: 1, address: 1, _id: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Libreria.countDocuments(filter),
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
const updateLibreria = async (
  libreriaId: string,
  data: Partial<ILibreria>,
): Promise<ILibreriaModel | null> => {
  const libreria = await Libreria.findById(libreriaId);
  if (libreria) {
    libreria.set(data);
    return await libreria.save();
  }
  return null;
};

const deleteLibreria = async (libreriaId: string): Promise<ILibreriaModel | null> => {
  return await setLibreriaDeleted(libreriaId, true);
};

const permanentDeleteLibreria = async (libreriaId: string): Promise<ILibreriaModel | null> => {
  return await Libreria.findByIdAndDelete(libreriaId);
};

const restoreLibreria = async (libreriaId: string): Promise<ILibreriaModel | null> => {
  return await setLibreriaDeleted(libreriaId, false);
};

const setLibreriaDeleted = async (
  libreriaId: string,
  IsDeleted: boolean,
): Promise<ILibreriaModel | null> => {
  return Libreria.findByIdAndUpdate(
    libreriaId,
    { IsDeleted, $unset: { isDeleted: 1 } },
    { new: true, runValidators: true },
  );
};

export default {
  createLibreria,
  getLibreria,
  getAllLibrerias,
  getAdminLibrerias,
  updateLibreria,
  deleteLibreria,
  permanentDeleteLibreria,
  restoreLibreria,
  setLibreriaDeleted,
};
