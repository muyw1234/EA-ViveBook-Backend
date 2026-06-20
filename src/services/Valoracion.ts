import mongoose, { FilterQuery } from 'mongoose';
import Valoracion, { IValoracionModel, IValoracion } from '../models/Valoracion';
import Usuario from '../models/Usuario';
import Libro from '../models/Libro';
import Logging from '../library/Logging';
import { getPagination, PaginatedResult } from './Pagination';

export type AdminValoracionQuery = {
  page?: number;
  limit?: number;
  search?: string;
  searchField?: AdminValoracionSearchField;
  includeDeleted?: boolean;
  puntuacion?: number;
  tipoOperacion?: IValoracion['tipoOperacion'];
};

export const adminValoracionSearchFields = ['user', 'book', 'rating', '_id'] as const;
export type AdminValoracionSearchField = (typeof adminValoracionSearchFields)[number];

const createValoracion = async (data: Partial<IValoracion>): Promise<IValoracionModel | null> => {
  const { usuarioAutor, usuarioValorado, libro, tipoOperacion, reservationId } = data;

  // 1. Check self-rating
  if (usuarioAutor === usuarioValorado) {
    throw new Error('No puedes valorarte a ti mismo');
  }

  // 2. Validate user exists
  const user = await Usuario.findById(usuarioAutor);
  if (!user) {
    Logging.error(`Valoracion error: Autor ${usuarioAutor} no encontrado`);
    throw new Error('Usuario autor no encontrado');
  }

  // 3. Check for existing rating for the transition
  let existing = null;
  if (reservationId) {
    existing = await Valoracion.findOne({
      usuarioAutor: new mongoose.Types.ObjectId(usuarioAutor),
      reservationId: new mongoose.Types.ObjectId(reservationId as string),
    });
  } else {
    existing = await Valoracion.findOne({
      usuarioAutor: new mongoose.Types.ObjectId(usuarioAutor),
      libro: new mongoose.Types.ObjectId(libro as string),
      tipoOperacion: tipoOperacion,
    });
  }

  if (existing) {
    Logging.error(`Valoracion error: Ya existe una valoración para esta operación`);
    throw new Error('Ya has valorado esta transacción');
  }

  const valoracion = new Valoracion({
    _id: new mongoose.Types.ObjectId(),
    ...data,
  });

  return await valoracion.save();
};

const getValoracionesReceived = async (usuarioId: string): Promise<IValoracionModel[]> => {
  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    Logging.warning(`Invalid usuarioId for valoraciones: ${usuarioId}`);
    return [];
  }
  return await Valoracion.find({
    usuarioValorado: new mongoose.Types.ObjectId(usuarioId),
    IsDeleted: { $ne: true },
  })
    .populate('usuarioAutor', 'name')
    .populate('libro', 'title')
    .sort({ createdAt: -1 });
};

const getValoracionesSent = async (usuarioId: string): Promise<IValoracionModel[]> => {
  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    Logging.warning(`Invalid usuarioId for sent valoraciones: ${usuarioId}`);
    return [];
  }
  return await Valoracion.find({
    usuarioAutor: new mongoose.Types.ObjectId(usuarioId),
    IsDeleted: { $ne: true },
  });
};

const getRatingStats = async (usuarioId: string) => {
  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    return { averageRating: 0, totalReviews: 0 };
  }
  const stats = await Valoracion.aggregate([
    {
      $match: {
        usuarioValorado: new mongoose.Types.ObjectId(usuarioId),
        IsDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: '$usuarioValorado',
        averageRating: { $avg: '$puntuacion' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  return {
    averageRating: parseFloat(stats[0].averageRating.toFixed(1)),
    totalReviews: stats[0].totalReviews,
  };
};

const getAdminValoraciones = async ({
  page = 1,
  limit = 10,
  search = '',
  searchField = 'user',
  includeDeleted = true,
  puntuacion,
  tipoOperacion,
}: AdminValoracionQuery): Promise<PaginatedResult<IValoracionModel>> => {
  const pagination = getPagination(page, limit);
  const filter: FilterQuery<IValoracionModel> = {};
  const normalizedSearch = search.trim();

  if (!includeDeleted) filter.IsDeleted = false;
  if (puntuacion) filter.puntuacion = puntuacion;
  if (tipoOperacion) filter.tipoOperacion = tipoOperacion;

  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escapedSearch, $options: 'i' };

    switch (searchField) {
      case 'user': {
        const users = await Usuario.find({ $or: [{ name: regex }, { email: regex }] }).select(
          '_id',
        );
        const userIds = users.map((user) => user._id);
        filter.$or = [{ usuarioAutor: { $in: userIds } }, { usuarioValorado: { $in: userIds } }];
        break;
      }
      case 'book': {
        const books = await Libro.find({ $or: [{ title: regex }, { isbn: regex }] }).select('_id');
        filter.libro = { $in: books.map((book) => book._id) };
        break;
      }
      case 'rating': {
        const rating = Number(normalizedSearch);
        filter.puntuacion =
          Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : { $exists: false };
        break;
      }
      case '_id':
        filter._id = mongoose.Types.ObjectId.isValid(normalizedSearch)
          ? new mongoose.Types.ObjectId(normalizedSearch)
          : { $exists: false };
        break;
    }
  }

  const [data, total] = await Promise.all([
    Valoracion.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('usuarioAutor', 'name email')
      .populate('usuarioValorado', 'name email')
      .populate('libro', 'title isbn'),
    Valoracion.countDocuments(filter),
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

const getAdminValoracion = async (id: string): Promise<IValoracionModel | null> => {
  return Valoracion.findById(id)
    .populate('usuarioAutor', 'name email')
    .populate('usuarioValorado', 'name email')
    .populate('libro', 'title isbn');
};

const createAdminValoracion = async (
  data: Partial<IValoracion>,
): Promise<IValoracionModel | null> => {
  const valoracion = await Valoracion.create(data);
  return getAdminValoracion(valoracion._id.toString());
};

const updateAdminValoracion = async (
  id: string,
  data: Partial<IValoracion>,
): Promise<IValoracionModel | null> => {
  const valoracion = await Valoracion.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  return valoracion ? getAdminValoracion(id) : null;
};

const setValoracionDeleted = async (
  id: string,
  IsDeleted: boolean,
): Promise<IValoracionModel | null> => updateAdminValoracion(id, { IsDeleted });

const permanentDeleteValoracion = async (id: string): Promise<IValoracionModel | null> =>
  Valoracion.findByIdAndDelete(id);

export default {
  createValoracion,
  getValoracionesReceived,
  getValoracionesSent,
  getRatingStats,
  getAdminValoraciones,
  getAdminValoracion,
  createAdminValoracion,
  updateAdminValoracion,
  setValoracionDeleted,
  permanentDeleteValoracion,
};
