import { Express } from 'express';
import request from 'supertest';

const authRequest = (req: request.Test, token?: string) => {
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  return req;
};

export const toggleWishlist = (app: Express, libroId: string, token?: string) => {
  return authRequest(request(app).post(`/usuarios/wishlist/${libroId}`), token);
};

export const toggleFavoriteBooks = (app: Express, libroId: string, token?: string) => {
  return authRequest(request(app).post(`/usuarios/favoritos/${libroId}`), token);
};

export const toggleFavoritos = (app: Express, libroId: string, token?: string) => {
  return authRequest(request(app).put(`/usuarios/favoritos/${libroId}`), token);
};

export const listFavoritos = (app: Express, token?: string) => {
  return authRequest(request(app).get('/usuarios/favoritos'), token);
};

export const checkFavorito = (app: Express, libroId: string, token?: string) => {
  return authRequest(request(app).get(`/usuarios/favoritos/${libroId}`), token);
};
