const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vivebook_DB';

async function printUsers() {
  await mongoose.connect(MONGO_URI);
  const users = await mongoose.connection
    .collection('usuarios')
    .find()
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  console.log(JSON.stringify(users, null, 2));
  await mongoose.disconnect();
}

printUsers().catch(console.error);
