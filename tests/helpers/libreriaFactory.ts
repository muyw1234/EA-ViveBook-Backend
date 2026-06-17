import { Express } from 'express';
import request from 'supertest';

type LibreriaPayload = {
  name: string;
  address: string;
  IsDeleted?: boolean;
};

export const buildLibreriaPayload = (
  overrides: Partial<LibreriaPayload> = {},
): LibreriaPayload => ({
  name: 'Libreria de prueba',
  address: 'Calle de prueba 123',
  ...overrides,
});

export const createLibreria = (app: Express, overrides: Partial<LibreriaPayload> = {}) => {
  return request(app).post('/librerias').send(buildLibreriaPayload(overrides));
};

export const getLibreria = (app: Express, libreriaId: string) => {
  return request(app).get(`/librerias/${libreriaId}`);
};

export const listLibrerias = (app: Express, query: Record<string, unknown> = {}) => {
  return request(app).get('/librerias').query(query);
};

export const updateLibreria = (
  app: Express,
  libreriaId: string,
  overrides: Partial<LibreriaPayload> = {},
) => {
  return request(app).put(`/librerias/${libreriaId}`).send(overrides);
};

export const deleteLibreria = (app: Express, libreriaId: string) => {
  return request(app).delete(`/librerias/${libreriaId}`);
};

export const restoreLibreria = (app: Express, libreriaId: string) => {
  return request(app).post(`/librerias/${libreriaId}/restaurar`);
};
