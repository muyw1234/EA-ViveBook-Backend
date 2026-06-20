import { Express } from 'express';
import request from 'supertest';

const authRequest = (req: request.Test, token?: string) => {
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  return req;
};

export const solicitarReserva = (app: Express, libroId: string, token?: string) => {
  return authRequest(request(app).post('/reservas').send({ libroId }), token);
};

export const aceptarReserva = (
  app: Express,
  reservaId: string,
  token?: string,
  body: { dias?: number } = {},
) => {
  return authRequest(request(app).post(`/reservas/aceptar/${reservaId}`).send(body), token);
};

export const rechazarReserva = (app: Express, reservaId: string, token?: string) => {
  return authRequest(request(app).post(`/reservas/rechazar/${reservaId}`), token);
};

export const listReservasSolicitadas = (
  app: Express,
  token?: string,
  query: Record<string, unknown> = {},
) => {
  return authRequest(request(app).get('/reservas/solicitadas').query(query), token);
};

export const listReservasRecibidas = (
  app: Express,
  token?: string,
  query: Record<string, unknown> = {},
) => {
  return authRequest(request(app).get('/reservas/recibidas').query(query), token);
};

export const deleteReserva = (app: Express, reservaId: string, token?: string) => {
  return authRequest(request(app).delete(`/reservas/${reservaId}`), token);
};
