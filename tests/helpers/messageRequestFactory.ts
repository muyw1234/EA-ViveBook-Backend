import { Express } from 'express';
import request from 'supertest';

const authRequest = (req: request.Test, token?: string) => {
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  return req;
};

export const createMessageRequest = (
  app: Express,
  token?: string,
  body: { bookId: string; initialMessage?: string } = { bookId: '' },
) => {
  return authRequest(request(app).post('/message-requests').send(body), token);
};

export const listReceivedMessageRequests = (app: Express, token?: string) => {
  return authRequest(request(app).get('/message-requests/received'), token);
};

export const listSentMessageRequests = (app: Express, token?: string) => {
  return authRequest(request(app).get('/message-requests/sent'), token);
};

export const acceptMessageRequest = (app: Express, requestId: string, token?: string) => {
  return authRequest(request(app).patch(`/message-requests/${requestId}/accept`), token);
};

export const denyMessageRequest = (app: Express, requestId: string, token?: string) => {
  return authRequest(request(app).patch(`/message-requests/${requestId}/deny`), token);
};

export const dismissMessageRequest = (app: Express, requestId: string, token?: string) => {
  return authRequest(request(app).patch(`/message-requests/${requestId}/dismiss`), token);
};
