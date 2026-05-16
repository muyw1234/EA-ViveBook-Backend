import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Mensaje from '../models/Mensaje';

const createMensaje = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mensaje = new Mensaje({
      _id: new mongoose.Types.ObjectId(),
      ...req.body,
    });
    const savedMensaje = await mensaje.save();
    return res.status(201).json(savedMensaje);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const getMensajesByChat = async (req: Request, res: Response, next: NextFunction) => {
  const chatId = req.params.chatId;
  try {
    const mensajes = await Mensaje.find({ chat: chatId }).populate('sender');
    return res.status(200).json(mensajes);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

export default { createMensaje, getMensajesByChat };
