import crypto from 'crypto';

const algorithm = 'md5'; // lo mejor seria ponerlo en .env

export function hash(text: string) {
    return crypto.createHash(algorithm).update(text).digest('hex');
}
