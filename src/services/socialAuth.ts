import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/config';

const googleClient = new OAuth2Client(config.google.clientId);

export interface SocialUser {
  email?: string;
  name?: string;
  sub: string;
  picture?: string;
}

export const verifyGoogleToken = async (idToken: string): Promise<SocialUser> => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.google.clientId, // Puede ser un array si tienes varios clientes
  });
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid Google token');
  }
  return {
    email: payload.email,
    name: payload.name,
    sub: payload.sub,
    picture: payload.picture,
  };
};

export default {
  verifyGoogleToken,
};
