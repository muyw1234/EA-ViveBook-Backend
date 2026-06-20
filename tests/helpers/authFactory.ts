import { Express } from 'express';
import request from 'supertest';

type SignupPayload = {
  name: string;
  email: string;
  password: string;
  rol?: 'Admin' | 'User';
};

type SigninPayload = {
  email: string;
  password: string;
};

export const buildSignupPayload = (overrides: Partial<SignupPayload> = {}): SignupPayload => ({
  name: 'Usuario Auth',
  email: `auth-${Date.now()}-${Math.random()}@test.com`,
  password: 'password123',
  ...overrides,
});

export const signup = (app: Express, overrides: Partial<SignupPayload> = {}) => {
  return request(app).post('/auth/signup').send(buildSignupPayload(overrides));
};

export const adminSignup = (app: Express, overrides: Partial<SignupPayload> = {}) => {
  return request(app).post('/auth/admin-signup').send(buildSignupPayload(overrides));
};

export const signin = (app: Express, payload: SigninPayload) => {
  return request(app).post('/auth/signin').send(payload);
};

export const getProfile = (app: Express, token?: string) => {
  const req = request(app).get('/auth/profile');

  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  return req;
};

export const getProfileLibros = (
  app: Express,
  token?: string,
  query: Record<string, unknown> = {},
) => {
  const req = request(app).get('/auth/profile/libros').query(query);

  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  return req;
};

export const socialLogin = (
  app: Express,
  payload: { provider: 'google' | 'apple'; idToken: string; name?: string },
) => {
  return request(app).post('/auth/social-login').send(payload);
};
