import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vivebook_DB';

async function inspectDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const Libro = mongoose.model('Libro', new mongoose.Schema({}, { strict: false }));
        const Usuario = mongoose.model('Usuario', new mongoose.Schema({}, { strict: false }));

        const books = await Libro.find({});
        console.log(`Total books: ${books.length}`);
        books.forEach((b) => console.log(`Book: ${b.title} (${b._id})`));

        const users = await Usuario.find({});
        console.log(`Total users: ${users.length}`);
        users.forEach((u) => console.log(`User: ${u.email} (${u._id}), libros: ${JSON.stringify(u.libros)}`));
    } catch (error) {
        console.error('Error inspecting database:', error);
    } finally {
        await mongoose.disconnect();
    }
}

inspectDB();
