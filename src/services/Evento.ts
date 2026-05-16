import mongoose from 'mongoose';
import Evento, { IEventoModel, IEvento } from '../models/Evento';
import { getPagination, PaginatedResult } from './Pagination';

const createEvento = async (data: Partial<IEvento>): Promise<IEventoModel> => {
  const evento = new Evento({
    _id: new mongoose.Types.ObjectId(),
    ...data,
  });
  return await evento.save();
};

const getEvento = async (eventoId: string): Promise<IEventoModel | null> => {
  return await Evento.findById(eventoId);
};

const getAllEventos = async (page = 1, limit = 10): Promise<PaginatedResult<IEventoModel>> => {
  const pagination = getPagination(page, limit);
  const [data, total] = await Promise.all([
    Evento.find().sort({ _id: 1 }).skip(pagination.skip).limit(pagination.limit),
    Evento.countDocuments(),
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
  const evento = await Evento.findById(eventoId);
  if (evento) {
    evento.set(data);
    return await evento.save();
  }
  return null;
};

const deleteEvento = async (eventoId: string): Promise<IEventoModel | null> => {
  return await Evento.findByIdAndUpdate(
    eventoId,
    { IsDeleted: true }, // Soft delete by setting IsDeleted to true
    { new: true },
  ); // Return the updated document
};

const restoreEvento = async (eventoId: string): Promise<IEventoModel | null> => {
  return await Evento.findByIdAndUpdate(
    eventoId,
    { IsDeleted: false }, // Restore by setting IsDeleted to false
    { new: true },
  ); // Return the updated document
};

export default {
  createEvento,
  getEvento,
  getAllEventos,
  getEventsAtExactLocation,
  updateEvento,
  deleteEvento,
  restoreEvento,
};
