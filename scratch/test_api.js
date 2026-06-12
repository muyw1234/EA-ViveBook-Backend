const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function test() {
  console.log('Connecting to DB to get user info...');
  await mongoose.connect('mongodb://localhost:27017/vivebook_DB');
  const db = mongoose.connection.db;

  // Get a user
  const user = await db.collection('usuarios').findOne({ email: 'test12@gmail.com' });
  if (!user) {
    console.error('User test12@gmail.com not found!');
    process.exit(1);
  }
  console.log(`Found user: ${user.name} (${user._id})`);

  // Sign JWT token
  const token = jwt.sign(
    { _id: user._id.toString(), rol: user.rol || 'User' },
    'LLAVE TEMPORAL, PORFAVOR CAMBIAME',
    { expiresIn: '15m' },
  );
  console.log('Signed JWT token.');

  await mongoose.disconnect();

  // Send POST request
  const bookId = '69bcf510f7c00c4bbf6fb91b'; // Use a test book ID
  console.log(`Sending POST request to toggle favorite for book: ${bookId}...`);
  try {
    const res = await axios.post(
      `http://localhost:1337/usuarios/favoritos/${bookId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    console.log('STATUS:', res.status);
    console.log('RESPONSE DATA:', res.data);
  } catch (err) {
    console.error('Error occurred during request:');
    if (err.response) {
      console.error('STATUS:', err.response.status);
      console.error('DATA:', err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

test().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
