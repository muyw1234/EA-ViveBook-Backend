import * as admin from 'firebase-admin';

const serviceAccount = require('./firebaseAccountKey.ts');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const messaging = admin.messaging();
