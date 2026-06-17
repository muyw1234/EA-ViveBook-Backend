import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestApp } from './helpers/appFactory';

describe('Express app', () => {
  it('responde correctamente al endpoint de salud', async () => {
    const app = createTestApp();

    const response = await request(app).get('/ping');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ hello: 'world' });
  });

  it('devuelve 404 para rutas no registradas', async () => {
    const app = createTestApp();

    const response = await request(app).get('/ruta-inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Not found' });
  });
});
