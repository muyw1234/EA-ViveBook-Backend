import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import EventoService from '../services/Evento';
import { getPaginationParams } from './Pagination';

const createEvento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evento = await EventoService.createEvento(req.body);
    return res.status(201).json(evento);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const getEvento = async (req: Request, res: Response, next: NextFunction) => {
  const eventoId = req.params.eventoId;
  try {
    const evento = await EventoService.getEvento(eventoId);
    return evento ? res.status(200).json(evento) : res.status(404).json({ message: 'not found' });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const getAllEventos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const eventos = await EventoService.getAllEventos(page, limit);
    return res.status(200).json(eventos);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const getEventosByExactLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lng, lat } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ message: 'Falta coordenadas: lng y lat son requeridas.' });
    }

    const longitude = parseFloat(lng as string);
    const latitude = parseFloat(lat as string);

    if (isNaN(longitude) || isNaN(latitude)) {
      return res
        .status(400)
        .json({ message: 'Formato de coordenadas inválido. Deben ser números.' });
    }

    const eventos = await EventoService.getEventsAtExactLocation(longitude, latitude);
    return res.status(200).json(eventos);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const updateEvento = async (req: Request, res: Response, next: NextFunction) => {
  const eventoId = req.params.eventoId;
  try {
    const evento = await EventoService.updateEvento(eventoId, req.body);
    if (evento) {
      return res.status(201).json(evento);
    } else {
      return res.status(404).json({ message: 'not found' });
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const deleteEvento = async (req: Request, res: Response, next: NextFunction) => {
  const eventoId = req.params.eventoId;
  try {
    const evento = await EventoService.deleteEvento(eventoId);
    return evento
      ? res.status(201).json({ message: 'deleted' })
      : res.status(404).json({ message: 'not found' });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const restoreEvento = async (req: Request, res: Response, next: NextFunction) => {
  const eventoId = req.params.eventoId;
  try {
    const evento = await EventoService.restoreEvento(eventoId);
    return evento ? res.status(200).json(evento) : res.status(404).json({ message: 'not found' });
  } catch (error) {
    return res.status(500).json({ error });
  }
};
export default {
  createEvento,
  getEvento,
  getAllEventos,
  getEventosByExactLocation,
  updateEvento,
  deleteEvento,
  restoreEvento,
};
