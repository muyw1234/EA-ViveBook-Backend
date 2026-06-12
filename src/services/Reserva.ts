import { FilterQuery } from 'mongoose';
import Libro from '../models/Libro';
import Reserva, { IReserva, IReservaModel } from '../models/Reserva';
import Usuario from '../models/Usuario';
import { getPagination, PaginatedResult } from './Pagination';

export type AdminReservaQuery = {
  page?: number;
  limit?: number;
  search?: string;
  includeDeleted?: boolean;
  estado?: IReserva['estado'];
};

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

  if (data.libro && !libro) throw new Error('El libro indicado no existe');
  if (data.usuarioSolicitante && !solicitante) {
    throw new Error('El usuario solicitante indicado no existe');
  }
  if (data.propietario && !propietario) throw new Error('El propietario indicado no existe');
  if (
    data.usuarioSolicitante &&
    data.propietario &&
    data.usuarioSolicitante.toString() === data.propietario.toString()
  ) {
    throw new Error('El solicitante y el propietario deben ser usuarios diferentes');
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
  if (conflict) throw new Error('El libro ya tiene otra reserva aceptada y activa');
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
    const [usuarios, libros] = await Promise.all([
      Usuario.find({
        $or: [
          { name: { $regex: escapedSearch, $options: 'i' } },
          { email: { $regex: escapedSearch, $options: 'i' } },
        ],
      }).select('_id'),
      Libro.find({
        $or: [
          { title: { $regex: escapedSearch, $options: 'i' } },
          { isbn: { $regex: escapedSearch, $options: 'i' } },
        ],
      }).select('_id'),
    ]);
    const userIds = usuarios.map((usuario) => usuario._id);
    const bookIds = libros.map((libro) => libro._id);
    filter.$or = [
      { estado: { $regex: escapedSearch, $options: 'i' } },
      { usuarioSolicitante: { $in: userIds } },
      { propietario: { $in: userIds } },
      { libro: { $in: bookIds } },
    ];
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

export default {
  getAdminReservas,
  getAdminReserva,
  createAdminReserva,
  updateAdminReserva,
  setReservaDeleted,
};
