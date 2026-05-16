import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Chat from '../models/Chat';

const createChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chat = new Chat({
      _id: new mongoose.Types.ObjectId(),
      ...req.body,
    });
    const savedChat = await chat.save();
    return res.status(201).json(savedChat);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const getChat = async (req: Request, res: Response, next: NextFunction) => {
  const chatId = req.params.chatId;
  try {
    const chat = await Chat.findById(chatId).populate('participants libro');
    return chat ? res.status(200).json(chat) : res.status(404).json({ message: 'not found' });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const getAllChats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chats = await Chat.find().populate('participants libro');
    return res.status(200).json(chats);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const deleteChat = async (req: Request, res: Response, next: NextFunction) => {
  const chatId = req.params.chatId;
  try {
    const chat = await Chat.findByIdAndDelete(chatId);
    return chat
      ? res.status(201).json({ message: 'deleted' })
      : res.status(404).json({ message: 'not found' });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

export default { createChat, getChat, getAllChats, deleteChat };
