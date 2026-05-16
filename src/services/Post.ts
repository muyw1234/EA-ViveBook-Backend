import Post, { IPost } from '../models/Post';
import LibroService from './Libro';
import mongoose from 'mongoose';
import { getPagination, PaginatedResult } from './Pagination';

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

async function updatePost(id: string, data: Partial<IPost>): Promise<IPost | null> {
  return await Post.findByIdAndUpdate(id, data).select('-__v');
}

async function deletePost(id: string): Promise<IPost | null> {
  return await Post.findByIdAndDelete(id).select('-__v');
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
  updatePost,
  deletePost,
  createPostByIsbn,
  searchPostByterm,
};
