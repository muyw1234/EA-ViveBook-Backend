import bcrypt from 'bcryptjs';
import mongoose, { FilterQuery } from 'mongoose';
import Usuario, { IUsuarioModel, IUsuario } from '../models/Usuario';
import { getPagination, PaginatedResult } from './Pagination';

export type AdminUsuarioQuery = {
  page?: number;
  limit?: number;
  search?: string;
  includeDeleted?: boolean;
  rol?: IUsuario['rol'];
};

const adminUsuarioSelect = '-password -googleId -appleId -expoPushToken';

const populateAdminUsuario = <T>(query: T): T => {
  const mongooseQuery = query as T & {
    populate: (path: string, select: string) => typeof mongooseQuery;
  };

  return mongooseQuery
    .populate('libros', 'title isbn type')
    .populate('boughtLibros', 'title isbn type')
    .populate('rentedLibros', 'title isbn type')
    .populate('favoriteBooks', 'title isbn type')
    .populate('wishlist', 'title isbn type')
    .populate('favoritos', 'title isbn type')
    .populate('followingUsers', 'name email rol')
    .populate('notificationUsersEnabled', 'name email rol') as T;
};

const createUsuario = async (data: Partial<IUsuario>): Promise<IUsuarioModel> => {
  const usuario = new Usuario({
    _id: new mongoose.Types.ObjectId(),
    ...data,
  });

  return await usuario.save();
};
const getUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
  return await Usuario.findById(usuarioId)
    .populate('libros', 'title')
    .populate('wishlist')
    .populate('favoriteBooks');
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

const getAdminUsuarios = async ({
  page = 1,
  limit = 10,
  search = '',
  includeDeleted = true,
  rol,
}: AdminUsuarioQuery): Promise<PaginatedResult<IUsuarioModel>> => {
  const pagination = getPagination(page, limit);
  const filter: FilterQuery<IUsuarioModel> = {};
  const normalizedSearch = search.trim();

  if (!includeDeleted) {
    filter.IsDeleted = false;
  }

  if (rol) {
    filter.rol = rol;
  }

  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    populateAdminUsuario(
      Usuario.find(filter)
        .select(adminUsuarioSelect)
        .sort({ name: 1, email: 1, _id: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
    ),
    Usuario.countDocuments(filter),
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

const getAdminUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
  return populateAdminUsuario(Usuario.findById(usuarioId).select(adminUsuarioSelect));
};

const createAdminUsuario = async (data: Partial<IUsuario>): Promise<IUsuarioModel | null> => {
  const password = await bcrypt.hash(data.password as string, 10);
  const usuario = await Usuario.create({
    ...data,
    email: data.email?.trim().toLowerCase(),
    password,
    authProvider: 'local',
  });

  return getAdminUsuario(usuario._id.toString());
};

const updateAdminUsuario = async (
  usuarioId: string,
  data: Partial<IUsuario>,
): Promise<IUsuarioModel | null> => {
  const updateData: Partial<IUsuario> = { ...data };

  if (typeof updateData.email === 'string') {
    updateData.email = updateData.email.trim().toLowerCase();
  }

  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  } else {
    delete updateData.password;
  }

  const usuario = await Usuario.findByIdAndUpdate(usuarioId, updateData, {
    new: true,
    runValidators: true,
  });

  return usuario ? getAdminUsuario(usuarioId) : null;
};

const setUsuarioDeleted = async (
  usuarioId: string,
  IsDeleted: boolean,
): Promise<IUsuarioModel | null> => {
  const usuario = await Usuario.findByIdAndUpdate(
    usuarioId,
    { IsDeleted },
    { new: true, runValidators: true },
  );

  return usuario ? getAdminUsuario(usuarioId) : null;
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
  getAdminUsuarios,
  getAdminUsuario,
  createAdminUsuario,
  updateAdminUsuario,
  setUsuarioDeleted,
  updateUsuario,
  deleteUsuario,
  permanentDeleteUsuario,
  restoreUsuario,
  searchUsuarioByName,
  getFavoritos,
  toggleFavorito,
  isFavorito,
};
