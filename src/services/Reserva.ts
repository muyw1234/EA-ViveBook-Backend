import mongoose, { FilterQuery } from 'mongoose';
import Libro from '../models/Libro';
import Reserva, { IReserva, IReservaModel } from '../models/Reserva';
import Usuario from '../models/Usuario';
import { getPagination, PaginatedResult } from './Pagination';
import { ApiError } from '../library/ApiResponse';

export type AdminReservaQuery = {
  page?: number;
  limit?: number;
  search?: string;
  searchField?: AdminReservaSearchField;
  includeDeleted?: boolean;
  estado?: IReserva['estado'];
};

export const adminReservaSearchFields = ['user', 'book', 'date', 'status', '_id'] as const;
export type AdminReservaSearchField = (typeof adminReservaSearchFields)[number];

const populateReserva = (id: string) =>
  Reserva.findById(id)
    .populate('libro', 'title isbn isReserved IsDeleted')
    .populate('usuarioSolicitante', 'name email IsDeleted')
    .populate('propietario', 'name email IsDeleted');

const validateRelations = async (data: Partial<IReserva>) => {
  const [libro, solicitante, propietario] = await Promise.all([
    data.libro ? Libro.findById(data.libro) : null,
    data.usuarioSolicitante ? Usuario.findById(data.usuarioSolicitante) : null,
    data.propietario ? Usuario.findById(data.propietario) : null,
  ]);

  if (data.libro && !libro) {
    throw new ApiError(400, 'El libro indicado no existe', 'BAD_REQUEST');
  }
  if (data.usuarioSolicitante && !solicitante) {
    throw new ApiError(400, 'El usuario solicitante indicado no existe', 'BAD_REQUEST');
  }
  if (data.propietario && !propietario) {
    throw new ApiError(400, 'El propietario indicado no existe', 'BAD_REQUEST');
  }
  if (
    data.usuarioSolicitante &&
    data.propietario &&
    data.usuarioSolicitante.toString() === data.propietario.toString()
  ) {
    throw new ApiError(
      400,
      'El solicitante y el propietario deben ser usuarios diferentes',
      'BAD_REQUEST',
    );
  }
};

const assertNoAcceptedConflict = async (
  data: Partial<IReserva>,
  currentId?: string,
): Promise<void> => {
  if (data.estado !== 'ACEPTADA' || data.IsDeleted) return;

  const conflict = await Reserva.findOne({
    _id: currentId ? { $ne: currentId } : { $exists: true },
    libro: data.libro,
    estado: 'ACEPTADA',
    IsDeleted: { $ne: true },
  });
  if (conflict) {
    throw new ApiError(409, 'El libro ya tiene otra reserva aceptada y activa', 'CONFLICT');
  }
};

const releaseBook = async (reserva: IReserva): Promise<void> => {
  await Libro.findOneAndUpdate(
    {
      _id: reserva.libro,
      reservedBy: reserva.usuarioSolicitante,
    },
    {
      $set: { isReserved: false },
      $unset: { reservedBy: 1, reservationExpiry: 1 },
    },
  );
};

const reconcileBook = async (
  reserva: IReservaModel,
  previous?: IReservaModel | null,
): Promise<void> => {
  const previousWasActive = previous?.estado === 'ACEPTADA' && previous.IsDeleted !== true;
  const currentIsActive = reserva.estado === 'ACEPTADA' && reserva.IsDeleted !== true;
  const changedBook = previous && previous.libro.toString() !== reserva.libro.toString();
  const changedApplicant =
    previous && previous.usuarioSolicitante.toString() !== reserva.usuarioSolicitante.toString();

  if (previousWasActive && (!currentIsActive || changedBook || changedApplicant)) {
    await releaseBook(previous);
  }

  if (!currentIsActive) return;

  await Libro.findByIdAndUpdate(reserva.libro, {
    isReserved: true,
    reservedBy: reserva.usuarioSolicitante,
    reservationExpiry: reserva.fechaLimite,
  });
  await Reserva.updateMany(
    {
      _id: { $ne: reserva._id },
      libro: reserva.libro,
      estado: 'PENDIENTE',
      IsDeleted: { $ne: true },
    },
    { estado: 'RECHAZADA' },
  );
};

const getAdminReservas = async ({
  page = 1,
  limit = 10,
  search = '',
  searchField = 'user',
  includeDeleted = true,
  estado,
}: AdminReservaQuery): Promise<PaginatedResult<IReservaModel>> => {
  const pagination = getPagination(page, limit);
  const filter: FilterQuery<IReservaModel> = {};
  const normalizedSearch = search.trim();

  if (!includeDeleted) filter.IsDeleted = false;
  if (estado) filter.estado = estado;

  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escapedSearch, $options: 'i' };

    switch (searchField) {
      case 'user': {
        const users = await Usuario.find({ $or: [{ name: regex }, { email: regex }] }).select(
          '_id',
        );
        const userIds = users.map((user) => user._id);
        filter.$or = [{ usuarioSolicitante: { $in: userIds } }, { propietario: { $in: userIds } }];
        break;
      }
      case 'book': {
        const books = await Libro.find({ $or: [{ title: regex }, { isbn: regex }] }).select('_id');
        filter.libro = { $in: books.map((book) => book._id) };
        break;
      }
      case 'date': {
        const date = new Date(normalizedSearch);
        if (Number.isNaN(date.getTime())) {
          filter._id = { $exists: false };
          break;
        }
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        filter.$or = [
          { fechaSolicitud: { $gte: start, $lt: end } },
          { fechaLimite: { $gte: start, $lt: end } },
        ];
        break;
      }
      case 'status':
        filter.estado = regex;
        break;
      case '_id':
        filter._id = mongoose.Types.ObjectId.isValid(normalizedSearch)
          ? new mongoose.Types.ObjectId(normalizedSearch)
          : { $exists: false };
        break;
    }
  }

  const [data, total] = await Promise.all([
    Reserva.find(filter)
      .sort({ fechaSolicitud: -1, _id: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('libro', 'title isbn isReserved IsDeleted')
      .populate('usuarioSolicitante', 'name email IsDeleted')
      .populate('propietario', 'name email IsDeleted'),
    Reserva.countDocuments(filter),
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

const getAdminReserva = async (id: string): Promise<IReservaModel | null> => populateReserva(id);

const createAdminReserva = async (data: Partial<IReserva>): Promise<IReservaModel | null> => {
  await validateRelations(data);
  await assertNoAcceptedConflict(data);
  const reserva = await Reserva.create(data);
  await reconcileBook(reserva);
  return populateReserva(reserva._id.toString());
};

const updateAdminReserva = async (
  id: string,
  data: Partial<IReserva>,
): Promise<IReservaModel | null> => {
  const previous = await Reserva.findById(id);
  if (!previous) return null;

  const nextData = {
    ...previous.toObject(),
    ...data,
  } as IReserva;
  await validateRelations(nextData);
  await assertNoAcceptedConflict(nextData, id);

  const reserva = await Reserva.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!reserva) return null;

  await reconcileBook(reserva, previous);
  return populateReserva(id);
};

const setReservaDeleted = async (id: string, IsDeleted: boolean): Promise<IReservaModel | null> =>
  updateAdminReserva(id, { IsDeleted });

const permanentDeleteReserva = async (id: string): Promise<IReservaModel | null> => {
  const reserva = await Reserva.findById(id);
  if (!reserva) return null;

  if (reserva.estado === 'ACEPTADA' && reserva.IsDeleted !== true) {
    await releaseBook(reserva);
  }

  return Reserva.findByIdAndDelete(id);
};

export default {
  getAdminReservas,
  getAdminReserva,
  createAdminReserva,
  updateAdminReserva,
  setReservaDeleted,
  permanentDeleteReserva,
};
