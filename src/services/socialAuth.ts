import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { config } from '../config/config';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface SocialUser {
  email?: string;
  name?: string;
  sub: string;
  picture?: string;
}

export const verifyGoogleToken = async (idToken: string): Promise<SocialUser> => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID, // Puede ser un array si tienes varios clientes
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

export const verifyAppleToken = async (idToken: string): Promise<SocialUser> => {
  try {
    const payload = await appleSignin.verifyIdToken(idToken, {
      audience: process.env.APPLE_CLIENT_ID,
      ignoreExpiration: false,
    });

    return {
      email: payload.email,
      // Apple solo envía el nombre en el primer inicio de sesión y no dentro del token, sino en el cuerpo.
      // Gestionaremos eso en el controlador
      sub: payload.sub,
    };
  } catch (error) {
    throw new Error('Invalid Apple token', { cause: error });
  }
};

export default {
  verifyGoogleToken,
  verifyAppleToken,
};
