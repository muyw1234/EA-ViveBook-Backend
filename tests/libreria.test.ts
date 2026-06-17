import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestApp } from './helpers/appFactory';
import {
  createLibreria,
  deleteLibreria,
  getLibreria,
  listLibrerias,
  restoreLibreria,
  updateLibreria,
} from './helpers/libreriaFactory';

describe('Librerias API', () => {
  const app = createTestApp();

  it('permite crear, consultar, actualizar, desactivar y restaurar una libreria', async () => {
    const createResponse = await createLibreria(app, {
      name: 'Libreria Fahrenheit',
      address: 'Calle Imaginaria 451',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      success: true,
      status: 201,
      data: {
        name: 'Libreria Fahrenheit',
        address: 'Calle Imaginaria 451',
        IsDeleted: false,
      },
    });

    const libreriaId = createResponse.body.data._id;
    expect(libreriaId).toEqual(expect.any(String));

    const getResponse = await getLibreria(app, libreriaId);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data).toMatchObject({
      _id: libreriaId,
      name: 'Libreria Fahrenheit',
      address: 'Calle Imaginaria 451',
      IsDeleted: false,
    });

    const updateResponse = await updateLibreria(app, libreriaId, {
      name: 'Libreria Nueva Fahrenheit',
      address: 'Avenida Imaginaria 451',
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data).toMatchObject({
      _id: libreriaId,
      name: 'Libreria Nueva Fahrenheit',
      address: 'Avenida Imaginaria 451',
      IsDeleted: false,
    });

    const deleteResponse = await deleteLibreria(app, libreriaId);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data).toMatchObject({
      _id: libreriaId,
      IsDeleted: true,
    });

    const restoreResponse = await restoreLibreria(app, libreriaId);

    expect(restoreResponse.status).toBe(200);
    expect(restoreResponse.body.data).toMatchObject({
      _id: libreriaId,
      IsDeleted: false,
    });
  });

  it('rechaza la creacion de una libreria sin address', async () => {
    const response = await request(app).post('/librerias').send({ name: 'Libreria incompleta' });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      status: 422,
      code: 'VALIDATION_ERROR',
    });
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'address',
          type: 'any.required',
        }),
      ]),
    );
  });

  it('devuelve 400 al consultar una libreria con ID invalido', async () => {
    const response = await getLibreria(app, 'id-invalido');

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

  it('devuelve 404 al actualizar, eliminar o restaurar una libreria inexistente', async () => {
    const missingLibreriaId = '64f1c2a1b2c3d4e5f6789012';

    const updateResponse = await updateLibreria(app, missingLibreriaId, {
      name: 'Libreria inexistente',
    });

    expect(updateResponse.status).toBe(404);
    expect(updateResponse.body).toMatchObject({
      success: false,
      status: 404,
      code: 'NOT_FOUND',
    });

    const deleteResponse = await deleteLibreria(app, missingLibreriaId);

    expect(deleteResponse.status).toBe(404);
    expect(deleteResponse.body).toMatchObject({
      success: false,
      status: 404,
      code: 'NOT_FOUND',
    });

    const restoreResponse = await restoreLibreria(app, missingLibreriaId);

    expect(restoreResponse.status).toBe(404);
    expect(restoreResponse.body).toMatchObject({
      success: false,
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('pagina el listado de librerias', async () => {
    await createLibreria(app, { name: 'Libreria A', address: 'Calle A' });
    await createLibreria(app, { name: 'Libreria B', address: 'Calle B' });
    await createLibreria(app, { name: 'Libreria C', address: 'Calle C' });

    const response = await listLibrerias(app, { page: 2, limit: 2 });

    expect(response.status).toBe(200);
    expect(response.body.data.data).toHaveLength(1);
    expect(response.body.data.data[0]).toMatchObject({
      name: 'Libreria C',
      address: 'Calle C',
      IsDeleted: false,
    });
    expect(response.body.data.pagination).toMatchObject({
      total: 3,
      page: 2,
      limit: 2,
      totalPages: 2,
    });
  });

  it('incluye librerias con IsDeleted true en el listado publico actual', async () => {
    await createLibreria(app, { name: 'Libreria activa', address: 'Calle activa' });
    await createLibreria(app, {
      name: 'Libreria desactivada',
      address: 'Calle desactivada',
      IsDeleted: true,
    });

    const response = await listLibrerias(app);

    expect(response.status).toBe(200);
    expect(response.body.data.data).toHaveLength(2);
    expect(response.body.data.pagination).toMatchObject({
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });
});
