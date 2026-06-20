import { Express } from 'express';
import request from 'supertest';

type AutorPayload = {
  fullName: string;
  IsDeleted?: boolean;
};

export const buildAutorPayload = (overrides: Partial<AutorPayload> = {}): AutorPayload => ({
  fullName: 'Autor de prueba',
  ...overrides,
});

export const createAutor = (app: Express, overrides: Partial<AutorPayload> = {}) => {
  return request(app).post('/autores').send(buildAutorPayload(overrides));
};

export const getAutor = (app: Express, autorId: string) => {
  return request(app).get(`/autores/${autorId}`);
};

export const listActiveAutores = (app: Express, query: Record<string, unknown> = {}) => {
  return request(app).get('/autores').query(query);
};

export const listAllAutores = (app: Express, query: Record<string, unknown> = {}) => {
  return request(app).get('/autores/all').query(query);
};

export const updateAutor = (
  app: Express,
  autorId: string,
  overrides: Partial<AutorPayload> = {},
) => {
  return request(app).put(`/autores/${autorId}`).send(overrides);
};

export const deleteAutor = (app: Express, autorId: string) => {
  return request(app).delete(`/autores/${autorId}`);
};
