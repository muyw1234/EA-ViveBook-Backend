import { NextFunction, Request, Response } from 'express';
import { IPost } from '../models/Post';
import PostService from '../services/Post';
import Logging from '../library/Logging';

async function createPost(req: Request, res: Response, next: NextFunction) {
    try {
        const buffer = await PostService.createPost({
            description: req.body.description,
            status: req.body.status,
            imageUrl: req.body.imageUrl,
            IsDeleted: req.body.isDeleted,
            ownerId: req.body.ownerId,
            bookId: req.body.bookId
        });
        return res.status(201).json(buffer);
    } catch (error) {
        Logging.error(error);
        return res.status(500).json({ message: error });
    }
}

async function createPostByIsbn(req: Request, res: Response, next: NextFunction) {
    try {
        const buffer = await PostService.createPostByIsbn(req.params.isbn as string, {
            description: req.body.description,
            status: req.body.status,
            imageUrl: req.body.imageUrl,
            IsDeleted: req.body.isDeleted,
            ownerId: req.body.ownerId
        });
        return res.status(201).json(buffer);
    } catch (error) {
        Logging.error(error);
        return res.status(500).json({ message: error });
    }
}

async function readPost(req: Request, res: Response, next: NextFunction) {
    try {
        const buffer = await PostService.getPostById(req.params.id as string);
        if (buffer === null) return res.status(404);
        return res.status(200).json(buffer);
    } catch (error) {
        Logging.error(error);
        return res.status(500).json({ message: error });
    }
}

async function readAllPost(req: Request, res: Response, next: NextFunction) {
    try {
        const buffer = await PostService.getAllPost();
        return res.status(200).json(buffer);
    } catch (error) {
        Logging.error(error);
        return res.status(500).json({ message: error });
    }
}

async function updatePost(req: Request, res: Response, next: NextFunction) {
    try {
        const data = {
            description: req.body.description,
            status: req.body.status,
            imageUrl: req.body.imageUrl,
            IsDeleted: req.body.isDeleted,
            ownerId: req.body.ownerId,
            bookId: req.body.bookId
        };
        const buffer = await PostService.updatePost(req.params.id as string, data);
        return res.status(200).json(buffer);
    } catch (error) {
        Logging.error(error);
        return res.status(500).json({ message: error });
    }
}

async function deletePost(req: Request, res: Response, next: NextFunction) {
    try {
        const buffer = await PostService.deletePost(req.params.id as string);
        return res.status(200).json(buffer);
    } catch (error) {
        Logging.error(error);
        return res.status(500).json({ message: error });
    }
}

export default { createPost, createPostByIsbn, readPost, readAllPost, updatePost, deletePost };
