import request from 'supertest';
import { describe, expect, it } from 'vitest';
import Libro from '../src/models/Libro';
import Usuario from '../src/models/Usuario';
import { createTestApp } from './helpers/appFactory';
import {
  buyLibro,
  createLibro,
  createLibroWithoutToken,
  deleteLibro,
  getLibro,
  listActiveLibros,
  listAllLibros,
  listLibrosByType,
  rentLibro,
  restoreLibro,
  updateLibro,
} from './helpers/libroFactory';
import { createTestUser } from './helpers/userFactory';

describe('Libros API', () => {
  const app = createTestApp();

  it('permite crear, consultar, actualizar y eliminar un libro autenticado', async () => {
    const { user, token } = await createTestUser();

    const createResponse = await createLibro(app, token, {
      isbn: '978-test-crear',
      title: 'Los desposeidos',
      authors: ['Ursula K. Le Guin'],
      type: 'VENTA',
      precio: 18,
      estado: 'usado',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      success: true,
      status: 201,
      data: {
        isbn: '978-test-crear',
        title: 'Los desposeidos',
        type: 'VENTA',
        precio: 18,
        estado: 'usado',
        IsDeleted: false,
        owner: user._id.toString(),
      },
    });

    const libroId = createResponse.body.data._id;
    expect(libroId).toEqual(expect.any(String));

    const linkedUser = await Usuario.findById(user._id);
    expect(linkedUser?.libros.map((id) => id.toString())).toContain(libroId);

    const getResponse = await getLibro(app, libroId);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data).toMatchObject({
      _id: libroId,
      isbn: '978-test-crear',
      title: 'Los desposeidos',
      owner: {
        _id: user._id.toString(),
        name: user.name,
      },
    });
    expect(getResponse.body.data.authors[0]).toMatchObject({
      fullName: 'Ursula K. Le Guin',
    });

    const updateResponse = await updateLibro(app, libroId, {
      title: 'Los desposeidos revisado',
      precio: 20,
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data).toMatchObject({
      _id: libroId,
      title: 'Los desposeidos revisado',
      precio: 20,
    });

    const deleteResponse = await deleteLibro(app, libroId);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data).toMatchObject({
      _id: libroId,
      title: 'Los desposeidos revisado',
    });

    const getDeletedResponse = await getLibro(app, libroId);

    expect(getDeletedResponse.status).toBe(404);
    expect(getDeletedResponse.body).toMatchObject({
      success: false,
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('requiere token para crear libros', async () => {
    const response = await createLibroWithoutToken(app);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      status: 401,
      code: 'UNAUTHORIZED',
    });
  });

  it('rechaza la creacion de un libro sin title', async () => {
    const { token } = await createTestUser();

    const response = await request(app)
      .post('/libros')
      .set('Authorization', `Bearer ${token}`)
      .send({
        isbn: '978-test-invalid',
        authors: ['Autor invalido'],
        type: 'VENTA',
        precio: 9,
        estado: 'nuevo',
      });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      status: 422,
      code: 'VALIDATION_ERROR',
    });
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'title',
          type: 'any.required',
        }),
      ]),
    );
  });

  it('devuelve 400 para ID invalido y 404 para libro inexistente', async () => {
    const invalidResponse = await getLibro(app, 'id-invalido');

    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body).toMatchObject({
      success: false,
      status: 400,
      code: 'BAD_REQUEST',
    });

    const missingLibroId = '64f1c2a1b2c3d4e5f6789012';

    const updateResponse = await updateLibro(app, missingLibroId, {
      title: 'Libro inexistente',
    });

    expect(updateResponse.status).toBe(404);
    expect(updateResponse.body).toMatchObject({
      success: false,
      status: 404,
      code: 'NOT_FOUND',
    });

    const deleteResponse = await deleteLibro(app, missingLibroId);

    expect(deleteResponse.status).toBe(404);
    expect(deleteResponse.body).toMatchObject({
      success: false,
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('pagina y filtra libros activos por tipo y precio maximo', async () => {
    const { token } = await createTestUser();

    await createLibro(app, token, {
      title: 'Libro venta barato',
      type: 'VENTA',
      precio: 8,
    });
    await createLibro(app, token, {
      title: 'Libro alquiler barato',
      type: 'ALQUILER',
      precio: 7,
    });
    await createLibro(app, token, {
      title: 'Libro venta caro',
      type: 'VENTA',
      precio: 30,
    });

    const filteredResponse = await listActiveLibros(app, {
      type: 'VENTA',
      maxPrice: 10,
    });

    expect(filteredResponse.status).toBe(200);
    expect(filteredResponse.body.data.data).toHaveLength(1);
    expect(filteredResponse.body.data.data[0]).toMatchObject({
      title: 'Libro venta barato',
      type: 'VENTA',
      precio: 8,
    });

    const paginatedResponse = await listActiveLibros(app, { page: 2, limit: 2 });

    expect(paginatedResponse.status).toBe(200);
    expect(paginatedResponse.body.data.data).toHaveLength(1);
    expect(paginatedResponse.body.data.pagination).toMatchObject({
      total: 3,
      page: 2,
      limit: 2,
      totalPages: 2,
    });

    const typeResponse = await listLibrosByType(app, 'ALQUILER');

    expect(typeResponse.status).toBe(200);
    expect(typeResponse.body.data.data).toHaveLength(1);
    expect(typeResponse.body.data.data[0]).toMatchObject({
      title: 'Libro alquiler barato',
      type: 'ALQUILER',
    });
  });

  it('excluye libros eliminados del listado activo, los incluye en all y permite restaurarlos', async () => {
    const { token } = await createTestUser();

    await createLibro(app, token, {
      title: 'Libro activo',
      IsDeleted: false,
    });
    const deletedResponse = await createLibro(app, token, {
      title: 'Libro eliminado',
      IsDeleted: true,
    });

    const activeResponse = await listActiveLibros(app);

    expect(activeResponse.status).toBe(200);
    expect(activeResponse.body.data.data).toHaveLength(1);
    expect(activeResponse.body.data.data[0]).toMatchObject({
      title: 'Libro activo',
      IsDeleted: false,
    });

    const allResponse = await listAllLibros(app);

    expect(allResponse.status).toBe(200);
    expect(allResponse.body.data.data).toHaveLength(2);

    const restoreResponse = await restoreLibro(app, deletedResponse.body.data._id);

    expect(restoreResponse.status).toBe(200);
    expect(restoreResponse.body.data).toMatchObject({
      _id: deletedResponse.body.data._id,
      IsDeleted: false,
    });
  });

  it('permite comprar un libro autenticado y lo registra en boughtLibros', async () => {
    const { token: ownerToken } = await createTestUser({
      email: 'owner-buy@test.com',
    });
    const { user: buyer, token: buyerToken } = await createTestUser({
      email: 'buyer@test.com',
    });
    const bookResponse = await createLibro(app, ownerToken, {
      title: 'Libro para comprar',
      type: 'VENTA',
    });
    const libroId = bookResponse.body.data._id;

    const response = await buyLibro(app, libroId, buyerToken);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: expect.any(String) });

    const updatedLibro = await Libro.findById(libroId);
    expect(updatedLibro?.IsDeleted).toBe(true);

    const updatedBuyer = await Usuario.findById(buyer._id);
    expect(updatedBuyer?.boughtLibros.map((id) => id.toString())).toContain(libroId);
  });

  it('permite alquilar un libro autenticado y lo registra en rentedLibros', async () => {
    const { token: ownerToken } = await createTestUser({
      email: 'owner-rent@test.com',
    });
    const { user: renter, token: renterToken } = await createTestUser({
      email: 'renter@test.com',
    });
    const bookResponse = await createLibro(app, ownerToken, {
      title: 'Libro para alquilar',
      type: 'ALQUILER',
    });
    const libroId = bookResponse.body.data._id;

    const response = await rentLibro(app, libroId, renterToken);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: expect.any(String) });

    const updatedLibro = await Libro.findById(libroId);
    expect(updatedLibro?.IsDeleted).toBe(true);

    const updatedRenter = await Usuario.findById(renter._id);
    expect(updatedRenter?.rentedLibros.map((id) => id.toString())).toContain(libroId);
  });

  it('requiere token para comprar o alquilar libros', async () => {
    const { token: ownerToken } = await createTestUser();
    const bookResponse = await createLibro(app, ownerToken, {
      title: 'Libro protegido',
    });
    const libroId = bookResponse.body.data._id;

    const buyResponse = await buyLibro(app, libroId);
    const rentResponse = await rentLibro(app, libroId);

    expect(buyResponse.status).toBe(401);
    expect(buyResponse.body).toMatchObject({
      success: false,
      status: 401,
      code: 'UNAUTHORIZED',
    });
    expect(rentResponse.status).toBe(401);
    expect(rentResponse.body).toMatchObject({
      success: false,
      status: 401,
      code: 'UNAUTHORIZED',
    });
  });

  it('rechaza comprar o alquilar un libro reservado', async () => {
    const { token: ownerToken } = await createTestUser({
      email: 'owner-reserved@test.com',
    });
    const { token: actorToken } = await createTestUser({
      email: 'reserved-actor@test.com',
    });
    const bookResponse = await createLibro(app, ownerToken, {
      title: 'Libro reservado',
    });
    const libroId = bookResponse.body.data._id;
    await Libro.findByIdAndUpdate(libroId, { isReserved: true });

    const buyResponse = await buyLibro(app, libroId, actorToken);
    const rentResponse = await rentLibro(app, libroId, actorToken);

    expect(buyResponse.status).toBe(400);
    expect(buyResponse.body).toEqual({ message: 'No se pudo completar la compra' });
    expect(rentResponse.status).toBe(400);
    expect(rentResponse.body).toEqual({ message: 'No se pudo completar el alquiler' });

    const reservedLibro = await Libro.findById(libroId);
    expect(reservedLibro?.IsDeleted).toBe(false);
  });
});
