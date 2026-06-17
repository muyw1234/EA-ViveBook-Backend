import { describe, expect, it } from 'vitest';
import Chat from '../src/models/Chat';
import Mensaje from '../src/models/Mensaje';
import MessageRequest from '../src/models/MessageRequest';
import { createTestApp } from './helpers/appFactory';
import { createLibro } from './helpers/libroFactory';
import {
  acceptMessageRequest,
  createMessageRequest,
  denyMessageRequest,
  dismissMessageRequest,
  listReceivedMessageRequests,
  listSentMessageRequests,
} from './helpers/messageRequestFactory';
import { createTestUser } from './helpers/userFactory';

describe('MessageRequests API', () => {
  const app = createTestApp();

  it('permite crear y listar solicitudes enviadas y recibidas', async () => {
    const { user: seller, token: sellerToken } = await createTestUser({
      email: 'message-seller@test.com',
    });
    const { user: requester, token: requesterToken } = await createTestUser({
      email: 'message-requester@test.com',
    });
    const bookResponse = await createLibro(app, sellerToken, {
      title: 'Libro para contactar',
    });
    const bookId = bookResponse.body.data._id;

    const createResponse = await createMessageRequest(app, requesterToken, {
      bookId,
      initialMessage: 'Me interesa este libro',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      success: true,
      status: 201,
      data: {
        status: 'pending',
        initialMessage: 'Me interesa este libro',
        requester: {
          _id: requester._id.toString(),
        },
        seller: {
          _id: seller._id.toString(),
        },
        book: {
          _id: bookId,
          title: 'Libro para contactar',
        },
      },
    });

    const receivedResponse = await listReceivedMessageRequests(app, sellerToken);

    expect(receivedResponse.status).toBe(200);
    expect(receivedResponse.body.data).toHaveLength(1);
    expect(receivedResponse.body.data[0]).toMatchObject({
      _id: createResponse.body.data._id,
      status: 'pending',
      requester: {
        _id: requester._id.toString(),
      },
    });

    const sentResponse = await listSentMessageRequests(app, requesterToken);

    expect(sentResponse.status).toBe(200);
    expect(sentResponse.body.data).toHaveLength(1);
    expect(sentResponse.body.data[0]).toMatchObject({
      _id: createResponse.body.data._id,
      status: 'pending',
      seller: {
        _id: seller._id.toString(),
      },
    });
  });

  it('acepta una solicitud y crea chat con mensaje inicial', async () => {
    const { user: seller, token: sellerToken } = await createTestUser({
      email: 'message-accept-seller@test.com',
    });
    const { user: requester, token: requesterToken } = await createTestUser({
      email: 'message-accept-requester@test.com',
    });
    const bookResponse = await createLibro(app, sellerToken, {
      title: 'Libro para aceptar chat',
    });
    const createResponse = await createMessageRequest(app, requesterToken, {
      bookId: bookResponse.body.data._id,
      initialMessage: 'Hola, podemos hablar?',
    });
    const requestId = createResponse.body.data._id;

    const acceptResponse = await acceptMessageRequest(app, requestId, sellerToken);

    expect(acceptResponse.status).toBe(200);
    expect(acceptResponse.body.data).toMatchObject({
      libro: {
        _id: bookResponse.body.data._id,
      },
    });
    expect(acceptResponse.body.data.participants.map((user: { _id: string }) => user._id)).toEqual(
      expect.arrayContaining([seller._id.toString(), requester._id.toString()]),
    );

    const request = await MessageRequest.findById(requestId);
    expect(request?.status).toBe('accepted');

    const chat = await Chat.findById(acceptResponse.body.data._id);
    expect(chat?.participants.map((id) => id.toString())).toEqual(
      expect.arrayContaining([seller._id.toString(), requester._id.toString()]),
    );

    const initialMessage = await Mensaje.findOne({ chat: chat?._id });
    expect(initialMessage).toMatchObject({
      sender: requester._id,
      content: 'Hola, podemos hablar?',
    });
  });

  it('deniega una solicitud pendiente', async () => {
    const { token: sellerToken } = await createTestUser({
      email: 'message-deny-seller@test.com',
    });
    const { token: requesterToken } = await createTestUser({
      email: 'message-deny-requester@test.com',
    });
    const bookResponse = await createLibro(app, sellerToken, {
      title: 'Libro para denegar chat',
    });
    const createResponse = await createMessageRequest(app, requesterToken, {
      bookId: bookResponse.body.data._id,
    });

    const denyResponse = await denyMessageRequest(app, createResponse.body.data._id, sellerToken);

    expect(denyResponse.status).toBe(200);
    expect(denyResponse.body.data).toMatchObject({
      _id: createResponse.body.data._id,
      status: 'denied',
    });

    const request = await MessageRequest.findById(createResponse.body.data._id);
    expect(request?.status).toBe('denied');
  });

  it('permite descartar una solicitud enviada para ocultarla del listado sent', async () => {
    const { token: sellerToken } = await createTestUser({
      email: 'message-dismiss-seller@test.com',
    });
    const { token: requesterToken } = await createTestUser({
      email: 'message-dismiss-requester@test.com',
    });
    const bookResponse = await createLibro(app, sellerToken, {
      title: 'Libro para descartar solicitud',
    });
    const createResponse = await createMessageRequest(app, requesterToken, {
      bookId: bookResponse.body.data._id,
    });
    const requestId = createResponse.body.data._id;

    const dismissResponse = await dismissMessageRequest(app, requestId, requesterToken);

    expect(dismissResponse.status).toBe(200);
    expect(dismissResponse.body).toMatchObject({
      success: true,
      status: 200,
      data: null,
    });

    const request = await MessageRequest.findById(requestId);
    expect(request?.requesterDismissed).toBe(true);

    const sentResponse = await listSentMessageRequests(app, requesterToken);
    expect(sentResponse.status).toBe(200);
    expect(sentResponse.body.data).toHaveLength(0);
  });

  it('rechaza solicitudes sin token, duplicadas, de libro propio o con chat existente', async () => {
    const { token: sellerToken } = await createTestUser({
      email: 'message-error-seller@test.com',
    });
    const { token: requesterToken } = await createTestUser({
      email: 'message-error-requester@test.com',
    });
    const bookResponse = await createLibro(app, sellerToken, {
      title: 'Libro reglas mensaje',
    });
    const bookId = bookResponse.body.data._id;

    const noTokenResponse = await createMessageRequest(app, undefined, { bookId });
    expect(noTokenResponse.status).toBe(401);
    expect(noTokenResponse.body).toMatchObject({
      success: false,
      status: 401,
      code: 'UNAUTHORIZED',
    });

    const ownBookResponse = await createMessageRequest(app, sellerToken, { bookId });
    expect(ownBookResponse.status).toBe(400);
    expect(ownBookResponse.body).toMatchObject({
      success: false,
      status: 400,
      code: 'BAD_REQUEST',
    });

    const firstResponse = await createMessageRequest(app, requesterToken, { bookId });
    const duplicateResponse = await createMessageRequest(app, requesterToken, { bookId });

    expect(firstResponse.status).toBe(201);
    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body).toMatchObject({
      success: false,
      status: 409,
      code: 'CONFLICT',
    });

    await acceptMessageRequest(app, firstResponse.body.data._id, sellerToken);
    const existingChatResponse = await createMessageRequest(app, requesterToken, { bookId });

    expect(existingChatResponse.status).toBe(409);
    expect(existingChatResponse.body).toMatchObject({
      success: false,
      status: 409,
      code: 'CONFLICT',
    });
  });

  it('solo el vendedor puede aceptar o denegar y solo participantes pueden descartar', async () => {
    const { token: sellerToken } = await createTestUser({
      email: 'message-auth-seller@test.com',
    });
    const { token: requesterToken } = await createTestUser({
      email: 'message-auth-requester@test.com',
    });
    const { token: otherToken } = await createTestUser({
      email: 'message-auth-other@test.com',
    });
    const bookResponse = await createLibro(app, sellerToken, {
      title: 'Libro permisos mensaje',
    });
    const createResponse = await createMessageRequest(app, requesterToken, {
      bookId: bookResponse.body.data._id,
    });
    const requestId = createResponse.body.data._id;

    const acceptByOther = await acceptMessageRequest(app, requestId, otherToken);
    const denyByOther = await denyMessageRequest(app, requestId, otherToken);
    const dismissByOther = await dismissMessageRequest(app, requestId, otherToken);

    expect(acceptByOther.status).toBe(403);
    expect(acceptByOther.body).toMatchObject({
      success: false,
      status: 403,
      code: 'FORBIDDEN',
    });
    expect(denyByOther.status).toBe(403);
    expect(denyByOther.body).toMatchObject({
      success: false,
      status: 403,
      code: 'FORBIDDEN',
    });
    expect(dismissByOther.status).toBe(403);
    expect(dismissByOther.body).toMatchObject({
      success: false,
      status: 403,
      code: 'FORBIDDEN',
    });
  });
});
