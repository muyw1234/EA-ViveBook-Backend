import Post, { IPost } from '../models/Post';
import LibroService from './Libro';
import { ILibroModel } from '../models/Libro';
import mongoose from 'mongoose';

async function createPost(data: Partial<IPost>): Promise<IPost | null> {
    const buffer = new Post({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    return await buffer.save();
}

async function getPostById(id: string): Promise<IPost | null> {
    return await Post.findById(id).select('-__v').populate('bookId');
}

async function getAllPost(): Promise<IPost[] | []> {
    return await Post.find().select('-__v').populate('bookId');
}

async function updatePost(id: string, data: Partial<IPost>): Promise<IPost | null> {
    return await Post.findByIdAndUpdate(id, data).select('-__v');
}

async function deletePost(id: string): Promise<IPost | null> {
    return await Post.findByIdAndDelete(id).select('-__v');
}

async function createPostByIsbn(isbn: string, data: Partial<IPost>): Promise<IPost | null> {
    let libro = await LibroService.createLibroByIsbn(isbn); // busca o crea el libro con ese isbn.
    if (libro === null) throw 'Libro no encontrado en la base de datos ni lo tiene OpenLibrary';
    const buffer = new Post({
        _id: new mongoose.Types.ObjectId(),
        description: data.description,
        status: data.status,
        imageUrl: data.imageUrl,
        IsDeleted: data.IsDeleted,
        ownerId: data.ownerId,
        bookId: libro?._id
    });

    return buffer.save();
}

export default { createPost, getPostById, getAllPost, updatePost, deletePost, createPostByIsbn };
