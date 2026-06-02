import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.MONGO_URI || '';
const SWAGGER_URL = process.env.SWAGGER_URL || 'localhost';
const SERVER_PORT = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 1337;
const SWAGGER_PORT = process.env.SWAGGER_PORT ? Number(process.env.SWAGGER_PORT) : 1337;

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'LlaveSecretaDefault';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'LlaveRefreshDefault';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'Pon el tuyo';
const CLOUDINARY_SECRET = process.env.CLOUDINARY_SECRET || 'Pon el turo';
const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME || 'Pon el tuyo';
const MATOMO_INSTANCE = process.env.MATOMO_INSTANCE || 'https://your-matomo-instance.com';
const MATOMO_API = process.env.MATOMO_API || 'your-api-key';

export const config = {
    mongo: {
        url: MONGO_URL
    },
    jwt: {
        accessSecret: JWT_ACCESS_SECRET,
        refreshSecret: JWT_REFRESH_SECRET,
        accessExpiresIn: JWT_ACCESS_EXPIRES_IN,
        refreshExpiresIn: JWT_REFRESH_EXPIRES_IN
    },
    server: {
        port: SERVER_PORT,
        swaggerUrl: SWAGGER_URL,
        swaggerPort: SWAGGER_PORT
    },
    cloudinary: {
        apiKey: CLOUDINARY_API_KEY,
        secret: CLOUDINARY_SECRET,
        name: CLOUDINARY_NAME
    },
    matomo: {
        instance: MATOMO_INSTANCE,
        api: MATOMO_API
    }
};
