import { describe, expect, it } from 'vitest';
import Usuario from '../src/models/Usuario';
import { createTestApp } from './helpers/appFactory';
import { adminSignup, getProfile, signin, signup, socialLogin } from './helpers/authFactory';

describe('Auth API', () => {
  const app = createTestApp();

  it('registra un usuario local y permite iniciar sesion', async () => {
    const email = 'local-user@test.com';
    const password = 'password123';

    const signupResponse = await signup(app, {
      name: 'Usuario Local',
      email,
      password,
    });

    expect(signupResponse.status).toBe(201);
    expect(signupResponse.headers['auth-token']).toEqual(expect.any(String));
    expect(signupResponse.body).toMatchObject({
      success: true,
      status: 201,
      data: {
        user: {
          name: 'Usuario Local',
          email,
          rol: 'User',
          IsDeleted: false,
        },
        token: expect.any(String),
      },
    });
    expect(signupResponse.body.data.user.password).not.toBe(password);

    const signinResponse = await signin(app, { email, password });

    expect(signinResponse.status).toBe(200);
    expect(signinResponse.headers['auth-token']).toEqual(expect.any(String));
    expect(signinResponse.body).toMatchObject({
      success: true,
      status: 200,
      data: {
        user: {
          email,
          rol: 'User',
        },
        token: expect.any(String),
      },
    });
  });

  it('registra un administrador desde admin-signup', async () => {
    const response = await adminSignup(app, {
      name: 'Admin Auth',
      email: 'admin-auth@test.com',
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      status: 201,
      data: {
        user: {
          email: 'admin-auth@test.com',
          rol: 'Admin',
        },
        token: expect.any(String),
      },
    });
  });

  it('rechaza signup invalido y email duplicado', async () => {
    const invalidResponse = await signup(app, {
      name: 'Email invalido',
      email: 'no-es-email',
      password: 'password123',
    });

    expect(invalidResponse.status).toBe(422);
    expect(invalidResponse.body).toMatchObject({
      success: false,
      status: 422,
      code: 'VALIDATION_ERROR',
    });

    const email = 'duplicate@test.com';
    await signup(app, {
      email,
      password: 'password123',
    });

    const duplicateResponse = await signup(app, {
      email,
      password: 'password123',
    });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body).toMatchObject({
      success: false,
      status: 409,
      code: 'CONFLICT',
    });
  });

  it('rechaza signin con credenciales incorrectas o payload invalido', async () => {
    const validationResponse = await signin(app, {
      email: 'bad-email',
      password: 'password123',
    });

    expect(validationResponse.status).toBe(422);
    expect(validationResponse.body).toMatchObject({
      success: false,
      status: 422,
      code: 'VALIDATION_ERROR',
    });

    const missingUserResponse = await signin(app, {
      email: 'missing@test.com',
      password: 'password123',
    });

    expect(missingUserResponse.status).toBe(400);
    expect(missingUserResponse.body).toMatchObject({
      success: false,
      status: 400,
      code: 'BAD_REQUEST',
    });

    const email = 'wrong-password@test.com';
    await signup(app, { email, password: 'password123' });

    const wrongPasswordResponse = await signin(app, {
      email,
      password: 'otra-password',
    });

    expect(wrongPasswordResponse.status).toBe(400);
    expect(wrongPasswordResponse.body).toMatchObject({
      success: false,
      status: 400,
      code: 'BAD_REQUEST',
    });
  });

  it('devuelve el perfil del usuario autenticado y rechaza peticiones sin token', async () => {
    const signupResponse = await signup(app, {
      name: 'Usuario Perfil',
      email: 'profile@test.com',
      password: 'password123',
    });
    const token = signupResponse.body.data.token;

    const unauthorizedResponse = await getProfile(app);

    expect(unauthorizedResponse.status).toBe(401);
    expect(unauthorizedResponse.body).toMatchObject({
      success: false,
      status: 401,
      code: 'UNAUTHORIZED',
    });

    const profileResponse = await getProfile(app, token);

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body).toMatchObject({
      success: true,
      status: 200,
      data: {
        email: 'profile@test.com',
        name: 'Usuario Perfil',
      },
    });
  });

  it('reactiva un usuario eliminado al iniciar sesion', async () => {
    const email = 'reactivate@test.com';
    const password = 'password123';
    await signup(app, { email, password });
    await Usuario.findOneAndUpdate({ email }, { IsDeleted: true });

    const response = await signin(app, { email, password });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({
      email,
      IsDeleted: false,
    });

    const user = await Usuario.findOne({ email });
    expect(user?.IsDeleted).toBe(false);
  });

  it('permite social-login con token mock y reutiliza el usuario existente', async () => {
    const idToken = `mock_social@test.com_${encodeURIComponent('Usuario Social')}_google-sub-1`;

    const firstResponse = await socialLogin(app, {
      provider: 'google',
      idToken,
    });

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body).toMatchObject({
      success: true,
      status: 200,
      data: {
        user: {
          email: 'social@test.com',
          name: 'Usuario Social',
          authProvider: 'google',
          googleId: 'google-sub-1',
        },
        token: expect.any(String),
      },
    });

    const secondResponse = await socialLogin(app, {
      provider: 'google',
      idToken,
    });

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.data.user._id).toBe(firstResponse.body.data.user._id);
    expect(await Usuario.countDocuments({ email: 'social@test.com' })).toBe(1);
  });
});
