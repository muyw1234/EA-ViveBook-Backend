import * as admin from 'firebase-admin';

const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const messaging = admin.messaging();
