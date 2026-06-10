const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vivebook';

async function inspect() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await mongoose.connection.db.collection('usuarios').find({}).toArray();
    console.log('\n--- USERS ---');
    users.forEach((u) => {
      console.log(`User: ${u.name} (${u.email}) - ID: ${u._id}`);
      console.log(`  Bought Libros: ${u.boughtLibros ? u.boughtLibros.length : 0}`);
      console.log(`  Rented Libros: ${u.rentedLibros ? u.rentedLibros.length : 0}`);
    });

    const valoraciones = await mongoose.connection.db.collection('valoracions').find({}).toArray();
    console.log('\n--- VALORACIONES ---');
    console.log(`Total Valoraciones: ${valoraciones.length}`);
    valoraciones.forEach((v) => {
      console.log(
        `From: ${v.usuarioAutor} To: ${v.usuarioValorado} - Score: ${v.puntuacion} - Book: ${v.libro}`,
      );
    });

    const libros = await mongoose.connection.db.collection('libros').find({}).toArray();
    console.log('\n--- LIBROS ---');
    libros.forEach((l) => {
      console.log(`Book: ${l.title} - Owner: ${l.owner} - Deleted: ${l.IsDeleted} - ID: ${l._id}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

inspect();
