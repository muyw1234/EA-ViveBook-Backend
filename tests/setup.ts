import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.CLOUDINARY_API_KEY ??= 'test-cloudinary-api-key';
process.env.CLOUDINARY_SECRET ??= 'test-cloudinary-secret';
process.env.CLOUDINARY_NAME ??= 'test-cloudinary-name';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoose.set('strictQuery', true);

  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();

  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
