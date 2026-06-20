import { Express } from 'express';
import request from 'supertest';

type LibroPayload = {
  isbn: string;
  title: string;
  authors?: string[];
  autor?: string;
  categoria?: string;
  type: 'VENTA' | 'ALQUILER';
  precio: number;
  estado: string;
  IsDeleted?: boolean;
  imageUrl?: string;
};

export const buildLibroPayload = (overrides: Partial<LibroPayload> = {}): LibroPayload => ({
  isbn: `ISBN-${Date.now()}-${Math.random()}`,
  title: 'Libro de prueba',
  authors: ['Autor de prueba'],
  categoria: 'Ficcion',
  type: 'VENTA',
  precio: 12,
  estado: 'nuevo',
  ...overrides,
});

export const createLibro = (app: Express, token: string, overrides: Partial<LibroPayload> = {}) => {
  return request(app)
    .post('/libros')
    .set('Authorization', `Bearer ${token}`)
    .send(buildLibroPayload(overrides));
};

export const createLibroWithoutToken = (app: Express, overrides: Partial<LibroPayload> = {}) => {
  return request(app).post('/libros').send(buildLibroPayload(overrides));
};

export const getLibro = (app: Express, libroId: string) => {
  return request(app).get(`/libros/${libroId}`);
};

export const listActiveLibros = (app: Express, query: Record<string, unknown> = {}) => {
  return request(app).get('/libros').query(query);
};

export const listAllLibros = (app: Express, query: Record<string, unknown> = {}) => {
  return request(app).get('/libros/all').query(query);
};

export const listLibrosByType = (
  app: Express,
  type: 'VENTA' | 'ALQUILER',
  query: Record<string, unknown> = {},
) => {
  return request(app).get(`/libros/type/${type}`).query(query);
};

export const updateLibro = (
  app: Express,
  libroId: string,
  overrides: Partial<LibroPayload> = {},
) => {
  return request(app).put(`/libros/${libroId}`).send(overrides);
};

export const deleteLibro = (app: Express, libroId: string) => {
  return request(app).delete(`/libros/${libroId}`);
};

export const restoreLibro = (app: Express, libroId: string) => {
  return request(app).put(`/libros/restore/${libroId}`);
};

export const buyLibro = (app: Express, libroId: string, token?: string) => {
  const req = request(app).post(`/libros/buy/${libroId}`);

  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  return req;
};

export const rentLibro = (app: Express, libroId: string, token?: string) => {
  const req = request(app).post(`/libros/rent/${libroId}`);

  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  return req;
};
