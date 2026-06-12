import mongoose from 'mongoose';
import Usuario, { IUsuarioModel, IUsuario } from '../models/Usuario';
import { getPagination, PaginatedResult } from './Pagination';

const createUsuario = async (data: Partial<IUsuario>): Promise<IUsuarioModel> => {
  const usuario = new Usuario({
    _id: new mongoose.Types.ObjectId(),
    ...data,
  });

  return await usuario.save();
};

const getUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
  return await Usuario.findById(usuarioId).populate('libros', 'title');
};

const getFollowers = async (usuarioId: string) => {
  return await Usuario.find({ followingUsers: usuarioId }).select('_id name email');
};

const getUsuarioByEmail = async (theEmail: string): Promise<IUsuarioModel | null> => {
  return await Usuario.findOne({ email: theEmail });
};

const getAllUsuarios = async (page = 1, limit = 10): Promise<PaginatedResult<IUsuarioModel>> => {
  const pagination = getPagination(page, limit);
  const [data, total] = await Promise.all([
    Usuario.find()
      .sort({ _id: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('libros', 'title'),
    Usuario.countDocuments(),
  ]);

  return {
    pagination: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    },
    data,
  };
};

const getAllUsuarios_NOT_Deleted = async (
  page = 1,
  limit = 10,
): Promise<PaginatedResult<IUsuarioModel>> => {
  const pagination = getPagination(page, limit);
  const filter = { IsDeleted: false };
  const [data, total] = await Promise.all([
    Usuario.find(filter)
      .sort({ _id: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('libros', 'title'),
    Usuario.countDocuments(filter),
  ]);

  return {
    pagination: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    },
    data,
  };
};

const updateUsuario = async (
  usuarioId: string,
  data: Partial<IUsuario>,
): Promise<IUsuarioModel | null> => {
  const usuario = await Usuario.findById(usuarioId);
  if (usuario) {
    usuario.set(data);
    return await usuario.save();
  }
  return null;
};

const deleteUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
  return await Usuario.findByIdAndUpdate(usuarioId, { IsDeleted: true }, { new: true });
};

const permanentDeleteUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
  return await Usuario.findByIdAndDelete(usuarioId);
};

const restoreUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
  return await Usuario.findByIdAndUpdate(usuarioId, { IsDeleted: false }, { new: true });
};

const getFavoritos = async (usuarioId: string): Promise<IUsuarioModel | null> => {
  return await Usuario.findById(usuarioId).populate('favoritos');
};

const toggleFavorito = async (
  usuarioId: string,
  libroId: string,
): Promise<IUsuarioModel | null> => {
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario) return null;

  if (!usuario.favoritos) {
    usuario.favoritos = [];
  }

  const index = usuario.favoritos.findIndex((id: any) => id.toString() === libroId);
  if (index === -1) {
    usuario.favoritos.push(libroId as any);
  } else {
    usuario.favoritos.splice(index, 1);
  }

  return await usuario.save();
};

const isFavorito = async (usuarioId: string, libroId: string): Promise<boolean> => {
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario || !usuario.favoritos) return false;
  return usuario.favoritos.some((id: any) => id.toString() === libroId);
};

async function searchUsuarioByName(
  term: string,
  page = 1,
  limit = 10,
): Promise<PaginatedResult<IUsuarioModel>> {
  const filter = { $text: { $search: term }, IsDeleted: false };
  const [data, total] = await Promise.all([
    Usuario.find(filter)
      .limit(limit)
      .skip((page - 1) * limit),
    Usuario.countDocuments(filter),
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

export default {
  createUsuario,
  getUsuario,
  getFollowers,
  getUsuarioByEmail,
  getAllUsuarios,
  getAllUsuarios_NOT_Deleted,
  updateUsuario,
  deleteUsuario,
  permanentDeleteUsuario,
  restoreUsuario,
  searchUsuarioByName,
  getFavoritos,
  toggleFavorito,
  isFavorito,
};
