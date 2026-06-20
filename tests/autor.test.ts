import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  createAutor,
  deleteAutor,
  getAutor,
  listActiveAutores,
  listAllAutores,
  updateAutor,
} from './helpers/autorFactory';
import { createTestApp } from './helpers/appFactory';

describe('Autores API', () => {
  const app = createTestApp();

  it('permite crear, consultar, actualizar y eliminar un autor', async () => {
    const createResponse = await createAutor(app, { fullName: 'Ursula K. Le Guin' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      success: true,
      status: 201,
      data: {
        fullName: 'Ursula K. Le Guin',
        IsDeleted: false,
      },
    });

    const autorId = createResponse.body.data._id;
    expect(autorId).toEqual(expect.any(String));

    const getResponse = await getAutor(app, autorId);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data).toMatchObject({
      _id: autorId,
      fullName: 'Ursula K. Le Guin',
      IsDeleted: false,
    });

    const listResponse = await listActiveAutores(app);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.data).toHaveLength(1);
    expect(listResponse.body.data.pagination).toMatchObject({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const updateResponse = await updateAutor(app, autorId, { fullName: 'Ursula Le Guin' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data).toMatchObject({
      _id: autorId,
      fullName: 'Ursula Le Guin',
    });

    const deleteResponse = await deleteAutor(app, autorId);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data).toMatchObject({
      _id: autorId,
      fullName: 'Ursula Le Guin',
    });

    const getDeletedResponse = await getAutor(app, autorId);

    expect(getDeletedResponse.status).toBe(404);
    expect(getDeletedResponse.body).toMatchObject({
      success: false,
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('rechaza la creacion de un autor sin fullName', async () => {
    const response = await request(app).post('/autores').send({});

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      status: 422,
      code: 'VALIDATION_ERROR',
    });
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'fullName',
          type: 'any.required',
        }),
      ]),
    );
  });

  it('devuelve 400 al consultar un autor con ID invalido', async () => {
    const response = await getAutor(app, 'id-invalido');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      status: 400,
      code: 'BAD_REQUEST',
    });
    expect(response.body.errors).toMatchObject({
      field: '_id',
      value: 'id-invalido',
    });
  });

  it('devuelve 404 al actualizar o eliminar un autor inexistente', async () => {
    const missingAutorId = '64f1c2a1b2c3d4e5f6789012';

    const updateResponse = await updateAutor(app, missingAutorId, {
      fullName: 'Autor inexistente',
    });

    expect(updateResponse.status).toBe(404);
    expect(updateResponse.body).toMatchObject({
      success: false,
      status: 404,
      code: 'NOT_FOUND',
    });

    const deleteResponse = await deleteAutor(app, missingAutorId);

    expect(deleteResponse.status).toBe(404);
    expect(deleteResponse.body).toMatchObject({
      success: false,
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('pagina el listado de autores', async () => {
    await createAutor(app, { fullName: 'Octavia Butler' });
    await createAutor(app, { fullName: 'Mary Shelley' });
    await createAutor(app, { fullName: 'Virginia Woolf' });

    const response = await listActiveAutores(app, { page: 2, limit: 2 });

    expect(response.status).toBe(200);
    expect(response.body.data.data).toHaveLength(1);
    expect(response.body.data.data[0]).toMatchObject({
      fullName: 'Virginia Woolf',
      IsDeleted: false,
    });
    expect(response.body.data.pagination).toMatchObject({
      total: 3,
      page: 2,
      limit: 2,
      totalPages: 2,
    });
  });

  it('excluye autores eliminados del listado activo y los incluye en el listado completo', async () => {
    await createAutor(app, { fullName: 'Autor activo' });
    await createAutor(app, {
      fullName: 'Autor eliminado',
      IsDeleted: true,
    });

    const activeResponse = await listActiveAutores(app);

    expect(activeResponse.status).toBe(200);
    expect(activeResponse.body.data.data).toHaveLength(1);
    expect(activeResponse.body.data.data[0]).toMatchObject({
      fullName: 'Autor activo',
      IsDeleted: false,
    });

    const allResponse = await listAllAutores(app);

    expect(allResponse.status).toBe(200);
    expect(allResponse.body.data.data).toHaveLength(2);
    expect(allResponse.body.data.pagination).toMatchObject({
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });
});
