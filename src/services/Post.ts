import Post, { IPost } from '../models/Post';
import Libro from '../models/Libro';
import Usuario from '../models/Usuario';
import LibroService from './Libro';
import mongoose from 'mongoose';
import { FilterQuery } from 'mongoose';
import { getPagination, PaginatedResult } from './Pagination';

export type AdminPostQuery = {
  page?: number;
  limit?: number;
  search?: string;
  searchField?: AdminPostSearchField;
  includeDeleted?: boolean;
  status?: IPost['status'];
};

export const adminPostSearchFields = ['book', 'owner', 'price', 'status', '_id'] as const;
export type AdminPostSearchField = (typeof adminPostSearchFields)[number];

async function createPost(data: Partial<IPost>): Promise<IPost | null> {
  const buffer = new Post({
    _id: new mongoose.Types.ObjectId(),
    ...data,
  });
  return await buffer.save();
}

async function getPostById(id: string): Promise<IPost | null> {
  return await Post.findById(id).select('-__v').populate('bookId');
}

async function getAllPost(page = 1, limit = 10): Promise<PaginatedResult<IPost>> {
  const pagination = getPagination(page, limit);
  const [data, total] = await Promise.all([
    Post.find()
      .select('-__v')
      .populate('bookId')
      .sort({ _id: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Post.countDocuments(),
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

async function getAdminPosts({
  page = 1,
  limit = 10,
  search = '',
  searchField,
  includeDeleted = true,
  status,
}: AdminPostQuery): Promise<PaginatedResult<IPost>> {
  const pagination = getPagination(page, limit);
  const filter: FilterQuery<IPost> = {};
  const normalizedSearch = search.trim();

  if (!includeDeleted) filter.IsDeleted = false;
  if (status) filter.status = status;

  if (normalizedSearch && searchField) {
    const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escapedSearch, $options: 'i' };

    switch (searchField) {
      case 'book': {
        const books = await Libro.find({ $or: [{ title: regex }, { isbn: regex }] }).select('_id');
        filter.bookId = { $in: books.map((book) => book._id) };
        break;
      }
      case 'owner': {
        const owners = await Usuario.find({ $or: [{ name: regex }, { email: regex }] }).select(
          '_id',
        );
        filter.ownerId = { $in: owners.map((owner) => owner._id) };
        break;
      }
      case 'price': {
        const price = Number(normalizedSearch.replace(',', '.'));
        filter.price = Number.isFinite(price) ? price : { $exists: false };
        break;
      }
      case 'status':
        filter.status = regex;
        break;
      case '_id':
        filter._id = mongoose.isValidObjectId(normalizedSearch)
          ? new mongoose.Types.ObjectId(normalizedSearch)
          : { $exists: false };
        break;
    }
  }

  const [data, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('ownerId', 'name email')
      .populate('bookId', 'title isbn'),
    Post.countDocuments(filter),
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

async function updatePost(id: string, data: Partial<IPost>): Promise<IPost | null> {
  return await Post.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .select('-__v')
    .populate('ownerId', 'name email')
    .populate('bookId', 'title isbn');
}

async function deletePost(id: string): Promise<IPost | null> {
  return await Post.findByIdAndDelete(id).select('-__v');
}

async function setPostDeleted(id: string, IsDeleted: boolean): Promise<IPost | null> {
  return updatePost(id, { IsDeleted } as Partial<IPost>);
}

async function createPostByIsbn(isbn: string, data: Partial<IPost>): Promise<IPost | null> {
  const libro = await LibroService.createLibroByIsbn(isbn); // busca o crea el libro con ese isbn.
  if (libro === null) throw 'Libro no encontrado en la base de datos ni lo tiene OpenLibrary';
  const buffer = new Post({
    _id: new mongoose.Types.ObjectId(),
    description: data.description,
    status: data.status,
    imageUrl: data.imageUrl,
    IsDeleted: data.IsDeleted,
    ownerId: data.ownerId,
    bookId: libro?._id,
    price: data.price,
  });

  return buffer.save();
}

async function searchPostByterm(term: string, page = 1, limit = 10): Promise<IPost[] | []> {
  return await Post.find({ $text: { $search: term } })
    .limit(limit)
    .skip((page - 1) * limit);
}

export default {
  createPost,
  getPostById,
  getAllPost,
  getAdminPosts,
  updatePost,
  deletePost,
  setPostDeleted,
  createPostByIsbn,
  searchPostByterm,
};
