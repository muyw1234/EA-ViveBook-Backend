import { describe, expect, it } from 'vitest';
import Libro from '../src/models/Libro';
import Mensaje from '../src/models/Mensaje';
import Reserva from '../src/models/Reserva';
import { createTestApp } from './helpers/appFactory';
import { createLibro } from './helpers/libroFactory';
import {
  aceptarReserva,
  deleteReserva,
  listReservasRecibidas,
  listReservasSolicitadas,
  rechazarReserva,
  solicitarReserva,
} from './helpers/reservaFactory';
import { createTestUser } from './helpers/userFactory';

describe('Reservas API', () => {
  const app = createTestApp();

  it('permite solicitar y aceptar una reserva, marcando el libro como reservado', async () => {
    const { user: owner, token: ownerToken } = await createTestUser({
      email: 'reserva-owner@test.com',
    });
    const { user: requester, token: requesterToken } = await createTestUser({
      email: 'reserva-requester@test.com',
    });
    const bookResponse = await createLibro(app, ownerToken, {
      title: 'Libro reservable',
    });
    const libroId = bookResponse.body.data._id;

    const requestResponse = await solicitarReserva(app, libroId, requesterToken);

    expect(requestResponse.status).toBe(201);
    expect(requestResponse.body).toMatchObject({
      success: true,
      status: 201,
      data: {
        libro: libroId,
        usuarioSolicitante: requester._id.toString(),
        propietario: owner._id.toString(),
        estado: 'PENDIENTE',
        IsDeleted: false,
      },
    });

    const reservaId = requestResponse.body.data._id;
    expect(await Mensaje.countDocuments({ relatedReservationId: reservaId })).toBe(1);

    const acceptResponse = await aceptarReserva(app, reservaId, ownerToken, { dias: 3 });

    expect(acceptResponse.status).toBe(200);
    expect(acceptResponse.body.data).toMatchObject({
      _id: reservaId,
      estado: 'ACEPTADA',
    });
    expect(acceptResponse.body.data.fechaLimite).toEqual(expect.any(String));

    const reservedBook = await Libro.findById(libroId);
    expect(reservedBook).toMatchObject({
      isReserved: true,
      reservedBy: requester._id,
    });
  });

  it('lista reservas solicitadas y recibidas con paginacion', async () => {
    const { token: ownerToken } = await createTestUser({
      email: 'reserva-list-owner@test.com',
    });
    const { token: requesterToken } = await createTestUser({
      email: 'reserva-list-requester@test.com',
    });
    const firstBook = await createLibro(app, ownerToken, {
      title: 'Reserva listada A',
    });
    const secondBook = await createLibro(app, ownerToken, {
      title: 'Reserva listada B',
    });

    await solicitarReserva(app, firstBook.body.data._id, requesterToken);
    await solicitarReserva(app, secondBook.body.data._id, requesterToken);

    const requestedResponse = await listReservasSolicitadas(app, requesterToken, {
      page: 1,
      limit: 1,
    });

    expect(requestedResponse.status).toBe(200);
    expect(requestedResponse.body.data.data).toHaveLength(1);
    expect(requestedResponse.body.data.pagination).toMatchObject({
      total: 2,
      page: 1,
      limit: 1,
      totalPages: 2,
    });

    const receivedResponse = await listReservasRecibidas(app, ownerToken);

    expect(receivedResponse.status).toBe(200);
    expect(receivedResponse.body.data.data).toHaveLength(2);
    expect(receivedResponse.body.data.data[0]).toMatchObject({
      estado: 'PENDIENTE',
    });
  });

  it('rechaza otras reservas pendientes cuando una reserva es aceptada', async () => {
    const { token: ownerToken } = await createTestUser({
      email: 'reserva-conflict-owner@test.com',
    });
    const { token: firstRequesterToken } = await createTestUser({
      email: 'reserva-conflict-a@test.com',
    });
    const { token: secondRequesterToken } = await createTestUser({
      email: 'reserva-conflict-b@test.com',
    });
    const bookResponse = await createLibro(app, ownerToken, {
      title: 'Libro con varias reservas',
    });
    const libroId = bookResponse.body.data._id;
    const firstReserva = await solicitarReserva(app, libroId, firstRequesterToken);
    const secondReserva = await solicitarReserva(app, libroId, secondRequesterToken);

    const acceptResponse = await aceptarReserva(app, firstReserva.body.data._id, ownerToken);

    expect(acceptResponse.status).toBe(200);

    const accepted = await Reserva.findById(firstReserva.body.data._id);
    const rejected = await Reserva.findById(secondReserva.body.data._id);

    expect(accepted?.estado).toBe('ACEPTADA');
    expect(rejected?.estado).toBe('RECHAZADA');
  });

  it('permite rechazar una reserva pendiente', async () => {
    const { token: ownerToken } = await createTestUser({
      email: 'reserva-reject-owner@test.com',
    });
    const { token: requesterToken } = await createTestUser({
      email: 'reserva-reject-requester@test.com',
    });
    const bookResponse = await createLibro(app, ownerToken, {
      title: 'Libro reserva rechazada',
    });
    const reservaResponse = await solicitarReserva(app, bookResponse.body.data._id, requesterToken);

    const response = await rechazarReserva(app, reservaResponse.body.data._id, ownerToken);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      _id: reservaResponse.body.data._id,
      estado: 'RECHAZADA',
    });
  });

  it('oculta una reserva eliminada para el usuario actual', async () => {
    const { token: ownerToken } = await createTestUser({
      email: 'reserva-delete-owner@test.com',
    });
    const { user: requester, token: requesterToken } = await createTestUser({
      email: 'reserva-delete-requester@test.com',
    });
    const bookResponse = await createLibro(app, ownerToken, {
      title: 'Libro reserva eliminable',
    });
    const reservaResponse = await solicitarReserva(app, bookResponse.body.data._id, requesterToken);
    const reservaId = reservaResponse.body.data._id;

    const deleteResponse = await deleteReserva(app, reservaId, requesterToken);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toMatchObject({
      success: true,
      status: 200,
      data: null,
    });

    const requestedResponse = await listReservasSolicitadas(app, requesterToken);

    expect(requestedResponse.status).toBe(200);
    expect(requestedResponse.body.data.data).toHaveLength(0);

    const reserva = await Reserva.findById(reservaId);
    expect(reserva?.deletedBy?.map((id) => id.toString())).toContain(requester._id.toString());
  });

  it('rechaza reservas sin token, de libro propio, duplicadas o de libro no disponible', async () => {
    const { token: ownerToken } = await createTestUser({
      email: 'reserva-error-owner@test.com',
    });
    const { token: requesterToken } = await createTestUser({
      email: 'reserva-error-requester@test.com',
    });
    const bookResponse = await createLibro(app, ownerToken, {
      title: 'Libro reglas reserva',
    });
    const libroId = bookResponse.body.data._id;

    const noTokenResponse = await solicitarReserva(app, libroId);

    expect(noTokenResponse.status).toBe(401);
    expect(noTokenResponse.body).toMatchObject({
      success: false,
      status: 401,
      code: 'UNAUTHORIZED',
    });

    const ownBookResponse = await solicitarReserva(app, libroId, ownerToken);

    expect(ownBookResponse.status).toBe(400);
    expect(ownBookResponse.body).toMatchObject({
      success: false,
      status: 400,
      code: 'BAD_REQUEST',
    });

    const firstResponse = await solicitarReserva(app, libroId, requesterToken);
    const duplicateResponse = await solicitarReserva(app, libroId, requesterToken);

    expect(firstResponse.status).toBe(201);
    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body).toMatchObject({
      success: false,
      status: 400,
      code: 'BAD_REQUEST',
    });

    await Libro.findByIdAndUpdate(libroId, { IsDeleted: true });
    const deletedBookResponse = await solicitarReserva(app, libroId, requesterToken);

    expect(deletedBookResponse.status).toBe(400);
  });

  it('solo el propietario puede aceptar o rechazar una reserva pendiente', async () => {
    const { token: ownerToken } = await createTestUser({
      email: 'reserva-auth-owner@test.com',
    });
    const { token: requesterToken } = await createTestUser({
      email: 'reserva-auth-requester@test.com',
    });
    const { token: otherToken } = await createTestUser({
      email: 'reserva-auth-other@test.com',
    });
    const bookResponse = await createLibro(app, ownerToken, {
      title: 'Libro permisos reserva',
    });
    const reservaResponse = await solicitarReserva(app, bookResponse.body.data._id, requesterToken);
    const reservaId = reservaResponse.body.data._id;

    const acceptByOther = await aceptarReserva(app, reservaId, otherToken);
    const rejectByOther = await rechazarReserva(app, reservaId, otherToken);

    expect(acceptByOther.status).toBe(401);
    expect(acceptByOther.body).toMatchObject({
      success: false,
      status: 401,
      code: 'UNAUTHORIZED',
    });
    expect(rejectByOther.status).toBe(401);
    expect(rejectByOther.body).toMatchObject({
      success: false,
      status: 401,
      code: 'UNAUTHORIZED',
    });
  });
});
