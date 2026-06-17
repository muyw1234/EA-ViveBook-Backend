import jwt from 'jsonwebtoken';
import Usuario from '../../src/models/Usuario';

type TestUserPayload = {
  name: string;
  email: string;
  password: string;
  rol: 'Admin' | 'User';
  IsDeleted?: boolean;
};

export const buildUserPayload = (overrides: Partial<TestUserPayload> = {}): TestUserPayload => ({
  name: 'Usuario de prueba',
  email: `user-${Date.now()}-${Math.random()}@test.com`,
  password: 'password123',
  rol: 'User',
  ...overrides,
});

export const createTestUser = async (overrides: Partial<TestUserPayload> = {}) => {
  const user = await Usuario.create(buildUserPayload(overrides));
  const token = jwt.sign(
    {
      _id: user._id.toString(),
      rol: user.rol,
    },
    process.env.JWT_ACCESS_SECRET ?? 'test-access-secret',
  );

  return { user, token };
};
