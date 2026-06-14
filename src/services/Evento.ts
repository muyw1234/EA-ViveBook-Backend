import mongoose, { FilterQuery } from 'mongoose';
import Evento, { IEventoModel, IEvento } from '../models/Evento';
import { getPagination, PaginatedResult } from './Pagination';
import Usuario from '../models/Usuario';

export const adminEventoSearchFields = ['title', 'eventDate', 'address', '_id'] as const;
export type AdminEventoSearchField = (typeof adminEventoSearchFields)[number];

export type AdminEventoQuery = {
  page?: number;
  limit?: number;
  search?: string;
  searchField?: AdminEventoSearchField;
  includeDeleted?: boolean;
  upcoming?: boolean;
};

const createEvento = async (data: Partial<IEvento>): Promise<IEventoModel> => {
  const evento = new Evento({
    _id: new mongoose.Types.ObjectId(),
    ...data,
  });
  return await evento.save();
};

const getEvento = async (eventoId: string): Promise<IEventoModel | null> => {
  const evento = await Evento.findById(eventoId)
    .populate('creator', 'name email') // Opcional: llena también el creador
    .populate('participant', 'name email avatar');
  return evento;
};

const getAllEventos = async (
  page = 1,
  limit = 10,
  filter: any = {},
  sort: any = { _id: 1 },
): Promise<PaginatedResult<IEventoModel>> => {
  const pagination = getPagination(page, limit);
  const [data, total] = await Promise.all([
    Evento.find(filter).sort(sort).skip(pagination.skip).limit(pagination.limit),
    Evento.countDocuments(filter),
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

const getAdminEventos = async ({
  page = 1,
  limit = 10,
  search = '',
  searchField = 'title',
  includeDeleted = true,
  upcoming,
}: AdminEventoQuery): Promise<PaginatedResult<IEventoModel>> => {
  const pagination = getPagination(page, limit);
  const filter: FilterQuery<IEventoModel> = {};
  const normalizedSearch = search.trim();

  if (!includeDeleted) filter.IsDeleted = false;
  if (upcoming === true) filter.eventDate = { $gte: new Date() };
  if (upcoming === false) filter.eventDate = { $lt: new Date() };

  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    switch (searchField) {
      case 'eventDate': {
        const isIsoDay = /^\d{4}-\d{2}-\d{2}$/.test(normalizedSearch);
        const start = isIsoDay ? new Date(`${normalizedSearch}T00:00:00.000Z`) : null;
        if (start && !Number.isNaN(start.getTime())) {
          const end = new Date(start);
          end.setUTCDate(end.getUTCDate() + 1);
          filter.eventDate = { $gte: start, $lt: end };
        } else {
          filter.eventDate = { $exists: false };
        }
        break;
      }
      case 'address':
        filter.direccionExacta = { $regex: escapedSearch, $options: 'i' };
        break;
      case '_id':
        filter._id = mongoose.Types.ObjectId.isValid(normalizedSearch)
          ? new mongoose.Types.ObjectId(normalizedSearch)
          : { $exists: false };
        break;
      case 'title':
      default:
        filter.title = { $regex: escapedSearch, $options: 'i' };
        break;
    }
  }

  const [data, total] = await Promise.all([
    Evento.find(filter)
      .sort({ eventDate: 1, _id: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('creator', 'name email')
      .populate('participant', 'name email avatar'),
    Evento.countDocuments(filter),
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

const getEventsAtExactLocation = async (lng: number, lat: number): Promise<IEventoModel[]> => {
  return await Evento.find({
    IsDeleted: { $ne: true },
    'location.coordinates': [lng, lat],
  });
};

const updateEvento = async (
  eventoId: string,
  data: Partial<IEvento>,
): Promise<IEventoModel | null> => {
  const evento = await Evento.findByIdAndUpdate(eventoId, data, {
    new: true,
    runValidators: true,
  });
  return evento
    ? evento.populate([
        { path: 'creator', select: 'name email' },
        { path: 'participant', select: 'name email avatar' },
      ])
    : null;
};

const deleteEvento = async (eventoId: string): Promise<IEventoModel | null> => {
  return await Evento.findByIdAndUpdate(
    eventoId,
    { IsDeleted: true }, // Soft delete by setting IsDeleted to true
    { new: true },
  ); // Return the updated document
};

const permanentDeleteEvento = async (eventoId: string): Promise<IEventoModel | null> => {
  return await Evento.findByIdAndDelete(eventoId);
};

const restoreEvento = async (eventoId: string): Promise<IEventoModel | null> => {
  return await setEventoDeleted(eventoId, false);
};

const setEventoDeleted = async (
  eventoId: string,
  IsDeleted: boolean,
): Promise<IEventoModel | null> => updateEvento(eventoId, { IsDeleted });

const participarEvento = async (
  eventoId: string,
  usuarioId: string,
): Promise<IEventoModel | null> => {
  await Usuario.findByIdAndUpdate(usuarioId, { $addToSet: { eventos: eventoId } });

  return await Evento.findByIdAndUpdate(
    eventoId,
    { $addToSet: { participant: usuarioId } },
    { new: true },
  ).populate('participant', 'name email avatar');
};

const leaveEvento = async (eventoId: string, usuarioId: string): Promise<IEventoModel | null> => {
  await Usuario.findByIdAndUpdate(usuarioId, { $pull: { eventos: eventoId } });

  return await Evento.findByIdAndUpdate(
    eventoId,
    { $pull: { participant: usuarioId } },
    { new: true },
  ).populate('participant', 'name email avatar');
};

export default {
  createEvento,
  getEvento,
  getAllEventos,
  getAdminEventos,
  getEventsAtExactLocation,
  updateEvento,
  deleteEvento,
  permanentDeleteEvento,
  restoreEvento,
  setEventoDeleted,
  participarEvento,
  leaveEvento,
};
