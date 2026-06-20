import bcrypt from 'bcryptjs';
import mongoose, { Types } from 'mongoose';

import { config } from './config/config';
import Autor from './models/Autor';
import Evento from './models/Evento';
import Libreria from './models/Libreria';
import Libro from './models/Libro';
import Post from './models/Post';
import ProgresoReto from './models/ProgresoReto';
import Reserva from './models/Reserva';
import Reto from './models/Reto';
import Usuario from './models/Usuario';
import Valoracion from './models/Valoracion';
import { getLibroMetadataByIsbn } from './services/Libro';

const DEMO_PASSWORD = 'ViveBook123!';

const date = (value: string): Date => new Date(`${value}T10:00:00.000Z`);
const objectId = (group: number, index: number): Types.ObjectId =>
  new Types.ObjectId(
    `${group.toString(16).padStart(2, '0')}${index.toString(16).padStart(22, '0')}`,
  );

const ids = {
  usuarios: Array.from({ length: 8 }, (_, index) => objectId(0xb1, index + 1)),
  libros: Array.from({ length: 15 }, (_, index) => objectId(0xc1, index + 1)),
  librerias: Array.from({ length: 5 }, (_, index) => objectId(0xd1, index + 1)),
  eventos: Array.from({ length: 6 }, (_, index) => objectId(0xe1, index + 1)),
  posts: Array.from({ length: 12 }, (_, index) => objectId(0xf1, index + 1)),
  reservas: Array.from({ length: 6 }, (_, index) => objectId(0xa2, index + 1)),
  valoraciones: Array.from({ length: 7 }, (_, index) => objectId(0xb2, index + 1)),
  retos: Array.from({ length: 6 }, (_, index) => objectId(0xc2, index + 1)),
  progresos: Array.from({ length: 12 }, (_, index) => objectId(0xd2, index + 1)),
};

const isbnSeed = [
  '9780140328721',
  '9780439139601',
  '9780061120084',
  '9780451524935',
  '9780307277671',
  '9780743273565',
  '9780140449136',
  '9780141439518',
  '9780141187761',
  '9780140449266',
  '9780142437230',
  '9780140283334',
  '9780143127741',
  '9780141182636',
  '9780062315007',
];

const fallbackBooks = [
  {
    title: 'Matilda',
    authors: ['Roald Dahl'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780140328721-L.jpg',
  },
  {
    title: 'Harry Potter and the Goblet of Fire',
    authors: ['J. K. Rowling'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780439139601-L.jpg',
  },
  {
    title: 'To Kill a Mockingbird',
    authors: ['Harper Lee'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg',
  },
  {
    title: '1984',
    authors: ['George Orwell'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
  },
  {
    title: 'The Road',
    authors: ['Cormac McCarthy'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780307277671-L.jpg',
  },
  {
    title: 'The Great Gatsby',
    authors: ['F. Scott Fitzgerald'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg',
  },
  {
    title: 'The Odyssey',
    authors: ['Homer'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780140449136-L.jpg',
  },
  {
    title: 'Pride and Prejudice',
    authors: ['Jane Austen'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg',
  },
  {
    title: 'The Bell Jar',
    authors: ['Sylvia Plath'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780141187761-L.jpg',
  },
  {
    title: 'The Iliad',
    authors: ['Homer'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780140449266-L.jpg',
  },
  {
    title: 'Moby-Dick',
    authors: ['Herman Melville'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780142437230-L.jpg',
  },
  {
    title: 'A Short History of Nearly Everything',
    authors: ['Bill Bryson'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780140283334-L.jpg',
  },
  {
    title: 'Sapiens',
    authors: ['Yuval Noah Harari'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780143127741-L.jpg',
  },
  {
    title: 'A Clockwork Orange',
    authors: ['Anthony Burgess'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780141182636-L.jpg',
  },
  {
    title: 'The Alchemist',
    authors: ['Paulo Coelho'],
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg',
  },
];

type BookSeed = {
  isbn: string;
  title: string;
  authors: string[];
  imageUrl: string;
};

const getBookSeed = async (isbn: string, index: number): Promise<BookSeed> => {
  try {
    const metadata = await getLibroMetadataByIsbn(isbn);
    return {
      isbn: metadata.isbn || isbn,
      title: metadata.title || fallbackBooks[index].title,
      authors: metadata.authors.length > 0 ? metadata.authors : fallbackBooks[index].authors,
      imageUrl: metadata.imageUrl || fallbackBooks[index].imageUrl,
    };
  } catch (error) {
    console.warn(`No se pudo consultar OpenLibrary para ISBN ${isbn}. Usando fallback local.`);
    return {
      isbn,
      ...fallbackBooks[index],
    };
  }
};

const ensureAuthor = async (fullName: string): Promise<Types.ObjectId> => {
  const normalizedName = fullName.trim() || 'Autor desconocido';
  const author = await Autor.findOneAndUpdate(
    { fullName: normalizedName },
    { $setOnInsert: { fullName: normalizedName } },
    { new: true, upsert: true },
  );

  return author._id;
};

const populateDB = async (): Promise<void> => {
  if (!config.mongo.url) {
    throw new Error('MONGO_URI no esta configurada.');
  }

  await mongoose.connect(config.mongo.url, { retryWrites: true, w: 'majority' });
  console.log(`Conectado a ${mongoose.connection.name}.`);

  await mongoose.connection.dropDatabase();
  console.log('Base de datos eliminada. Repoblando desde cero...');

  const password = await bcrypt.hash(DEMO_PASSWORD, 10);

  await Usuario.insertMany([
    {
      _id: ids.usuarios[0],
      name: 'Administradora ViveBook',
      email: 'admin@demo.vivebook.com',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=47',
      rol: 'Admin',
      description: 'Cuenta administrativa para revisar el BackOffice y la moderacion.',
      hasSeenTutorial: true,
      favoriteAuthors: ['Roald Dahl', 'Jane Austen'],
      favoriteCategories: ['Narrativa', 'Clasicos'],
      createdAt: date('2023-09-10'),
    },
    {
      _id: ids.usuarios[1],
      name: 'Lucia Ferrer',
      email: 'lucia@demo.vivebook.com',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=32',
      rol: 'User',
      description: 'Lectora de narrativa contemporanea y organizadora de clubes de lectura.',
      hasSeenTutorial: true,
      favoriteAuthors: ['Harper Lee', 'Jane Austen'],
      favoriteCategories: ['Narrativa', 'Romance'],
      createdAt: date('2024-01-16'),
    },
    {
      _id: ids.usuarios[2],
      name: 'Diego Navarro',
      email: 'diego@demo.vivebook.com',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=12',
      rol: 'User',
      description: 'Interesado en ciencia ficcion, ensayo y tecnologia.',
      hasSeenTutorial: true,
      favoriteAuthors: ['George Orwell', 'Bill Bryson'],
      favoriteCategories: ['Ciencia ficcion', 'Ensayo'],
      createdAt: date('2024-02-22'),
    },
    {
      _id: ids.usuarios[3],
      name: 'Marta Pons',
      email: 'marta@demo.vivebook.com',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=44',
      rol: 'User',
      description: 'Coleccionista de novela historica, mitologia y biografias.',
      hasSeenTutorial: false,
      favoriteAuthors: ['Homer'],
      favoriteCategories: ['Historia', 'Clasicos'],
      createdAt: date('2024-04-08'),
    },
    {
      _id: ids.usuarios[4],
      name: 'Alex Romero',
      email: 'alex@demo.vivebook.com',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=15',
      rol: 'User',
      description: 'Comparte libros juveniles, fantasia y aventuras.',
      hasSeenTutorial: true,
      favoriteAuthors: ['J. K. Rowling', 'Paulo Coelho'],
      favoriteCategories: ['Juvenil', 'Fantasia'],
      createdAt: date('2024-07-01'),
    },
    {
      _id: ids.usuarios[5],
      name: 'Sofia Blanco',
      email: 'sofia@demo.vivebook.com',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=25',
      rol: 'User',
      description: 'Busca recomendaciones de poesia, literatura breve y clasicos.',
      hasSeenTutorial: true,
      favoriteAuthors: ['Sylvia Plath'],
      favoriteCategories: ['Poesia', 'Relato'],
      createdAt: date('2024-09-13'),
    },
    {
      _id: ids.usuarios[6],
      name: 'Pablo Serra',
      email: 'pablo@demo.vivebook.com',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=5',
      rol: 'User',
      description: 'Usuario de demostracion con cuenta desactivada.',
      IsDeleted: true,
      hasSeenTutorial: false,
      favoriteCategories: ['Ensayo'],
      createdAt: date('2023-12-04'),
    },
    {
      _id: ids.usuarios[7],
      name: 'Gestora Editorial',
      email: 'gestora@demo.vivebook.com',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=49',
      rol: 'Admin',
      description: 'Segunda cuenta administrativa para visualizar distintos roles.',
      hasSeenTutorial: true,
      favoriteCategories: ['Narrativa', 'Poesia', 'Ensayo'],
      createdAt: date('2025-01-09'),
    },
  ]);

  const bookSeeds = await Promise.all(isbnSeed.map(getBookSeed));
  const bookConfig = [
    ['Juvenil', 'VENTA', 12.5, 4],
    ['Fantasia', 'ALQUILER', 5.5, 4],
    ['Narrativa', 'VENTA', 14.9, 1],
    ['Ciencia ficcion', 'ALQUILER', 4.75, 2],
    ['Narrativa', 'VENTA', 13.8, 5],
    ['Clasicos', 'VENTA', 16.2, 1],
    ['Clasicos', 'ALQUILER', 4.5, 3],
    ['Romance', 'VENTA', 11.9, 1],
    ['Poesia', 'ALQUILER', 4.0, 5],
    ['Clasicos', 'VENTA', 15.4, 3],
    ['Aventura', 'VENTA', 17.3, 2],
    ['Ensayo', 'ALQUILER', 6.25, 2],
    ['Historia', 'VENTA', 21.9, 0],
    ['Distopia', 'ALQUILER', 5.25, 5],
    ['Ficcion', 'VENTA', 13.2, 4],
  ] as const;

  const books = await Promise.all(
    bookSeeds.map(async (seed, index) => {
      const [categoria, type, precio, ownerIndex] = bookConfig[index];
      const authorIds = await Promise.all(seed.authors.map(ensureAuthor));

      return {
        _id: ids.libros[index],
        isbn: seed.isbn,
        title: seed.title,
        authors: authorIds,
        autor: seed.authors.join(', '),
        categoria,
        type,
        precio,
        estado: index === 10 ? 'NO_DISPONIBLE' : 'DISPONIBLE',
        owner: ids.usuarios[ownerIndex],
        imageUrl: seed.imageUrl,
        isReserved: index === 3 || index === 8,
        reservedBy: index === 3 ? ids.usuarios[1] : index === 8 ? ids.usuarios[2] : undefined,
        reservationExpiry: index === 3 || index === 8 ? date('2026-07-01') : undefined,
        createdAt: date(`2025-${String((index % 9) + 1).padStart(2, '0')}-12`),
      };
    }),
  );

  await Libro.insertMany(books);

  const booksByOwner = (ownerId: Types.ObjectId): Types.ObjectId[] =>
    books.filter((book) => book.owner.equals(ownerId)).map((book) => book._id);

  await Promise.all([
    Usuario.findByIdAndUpdate(ids.usuarios[0], {
      libros: booksByOwner(ids.usuarios[0]),
      boughtLibros: [ids.libros[2], ids.libros[5]],
      rentedLibros: [ids.libros[1]],
      favoriteBooks: [ids.libros[0], ids.libros[7], ids.libros[12]],
      wishlist: [ids.libros[9], ids.libros[14]],
      favoritos: [ids.libros[5]],
      followingUsers: [ids.usuarios[1], ids.usuarios[7]],
      notificationUsersEnabled: [ids.usuarios[1]],
    }),
    Usuario.findByIdAndUpdate(ids.usuarios[1], {
      libros: booksByOwner(ids.usuarios[1]),
      boughtLibros: [ids.libros[9], ids.libros[13]],
      rentedLibros: [ids.libros[1], ids.libros[8]],
      favoriteBooks: [ids.libros[2], ids.libros[7]],
      wishlist: [ids.libros[4], ids.libros[12]],
      favoritos: [ids.libros[0], ids.libros[2]],
      followingUsers: [ids.usuarios[2], ids.usuarios[5]],
      notificationUsersEnabled: [ids.usuarios[2], ids.usuarios[5]],
    }),
    Usuario.findByIdAndUpdate(ids.usuarios[2], {
      libros: booksByOwner(ids.usuarios[2]),
      boughtLibros: [ids.libros[10]],
      rentedLibros: [ids.libros[3]],
      favoriteBooks: [ids.libros[3], ids.libros[11]],
      wishlist: [ids.libros[6]],
      favoritos: [ids.libros[10]],
      followingUsers: [ids.usuarios[1]],
      notificationUsersEnabled: [ids.usuarios[1]],
    }),
    Usuario.findByIdAndUpdate(ids.usuarios[3], {
      libros: booksByOwner(ids.usuarios[3]),
      boughtLibros: [ids.libros[6], ids.libros[9]],
      favoriteBooks: [ids.libros[6], ids.libros[9]],
      wishlist: [ids.libros[10]],
      favoritos: [ids.libros[3]],
      followingUsers: [ids.usuarios[1]],
    }),
    Usuario.findByIdAndUpdate(ids.usuarios[4], {
      libros: booksByOwner(ids.usuarios[4]),
      rentedLibros: [ids.libros[1]],
      favoriteBooks: [ids.libros[0], ids.libros[1], ids.libros[14]],
      wishlist: [ids.libros[3]],
      favoritos: [ids.libros[14]],
      followingUsers: [ids.usuarios[2], ids.usuarios[5]],
    }),
    Usuario.findByIdAndUpdate(ids.usuarios[5], {
      libros: booksByOwner(ids.usuarios[5]),
      boughtLibros: [ids.libros[4]],
      favoriteBooks: [ids.libros[8], ids.libros[13]],
      wishlist: [ids.libros[2]],
      favoritos: [ids.libros[8]],
      followingUsers: [ids.usuarios[1], ids.usuarios[3]],
    }),
  ]);

  await Libreria.insertMany([
    {
      _id: ids.librerias[0],
      name: 'Libreria Horizonte',
      address: 'Carrer de Mallorca, 184, Barcelona',
    },
    {
      _id: ids.librerias[1],
      name: 'La Pagina Azul',
      address: 'Carrer Gran de Gracia, 72, Barcelona',
    },
    {
      _id: ids.librerias[2],
      name: 'Punto y Aparte',
      address: 'Rambla de Catalunya, 41, Barcelona',
    },
    { _id: ids.librerias[3], name: 'Nave de Papel', address: 'Carrer de Sants, 125, Barcelona' },
    {
      _id: ids.librerias[4],
      name: 'El Rincon del Lector',
      address: 'Avinguda Diagonal, 402, Barcelona',
      IsDeleted: true,
    },
  ]);

  await Evento.insertMany([
    {
      _id: ids.eventos[0],
      title: 'Club de lectura: narrativa contemporanea',
      description: `Encuentro mensual para comentar ${books[2].title}.`,
      creator: ids.usuarios[1],
      participant: [ids.usuarios[1], ids.usuarios[2], ids.usuarios[5]],
      eventDate: date('2026-07-18'),
      createdDate: date('2026-05-20'),
      location: { type: 'Point', coordinates: [2.163, 41.39] },
      direccionExacta: 'Biblioteca Jaume Fuster, Barcelona',
    },
    {
      _id: ids.eventos[1],
      title: 'Intercambio de fantasia y aventura',
      description: 'Trae un libro y llevate otra historia para descubrir.',
      creator: ids.usuarios[4],
      participant: [ids.usuarios[2], ids.usuarios[4]],
      eventDate: date('2026-08-02'),
      createdDate: date('2026-05-25'),
      location: { type: 'Point', coordinates: [2.175, 41.385] },
      direccionExacta: 'Centre Civic Pati Llimona, Barcelona',
    },
    {
      _id: ids.eventos[2],
      title: 'Taller de poesia breve',
      description: 'Lectura y creacion de poemas en formato breve.',
      creator: ids.usuarios[5],
      participant: [ids.usuarios[1], ids.usuarios[3], ids.usuarios[5]],
      eventDate: date('2026-09-12'),
      createdDate: date('2026-06-01'),
      location: { type: 'Point', coordinates: [2.181, 41.401] },
      direccionExacta: 'Ateneu del Clot, Barcelona',
    },
    {
      _id: ids.eventos[3],
      title: 'Ruta literaria por Barcelona',
      description: 'Paseo por escenarios presentes en novelas historicas.',
      creator: ids.usuarios[3],
      participant: [ids.usuarios[0], ids.usuarios[1], ids.usuarios[3]],
      eventDate: date('2026-10-04'),
      createdDate: date('2026-06-05'),
      location: { type: 'Point', coordinates: [2.176, 41.382] },
      direccionExacta: 'Placa de Sant Jaume, Barcelona',
    },
    {
      _id: ids.eventos[4],
      title: 'Lecturas clasicas para principiantes',
      description: 'Sesion introductoria para acercarse a clasicos universales.',
      creator: ids.usuarios[0],
      participant: [ids.usuarios[0], ids.usuarios[2], ids.usuarios[4], ids.usuarios[5]],
      eventDate: date('2026-11-16'),
      createdDate: date('2026-06-10'),
      location: { type: 'Point', coordinates: [2.17, 41.392] },
      direccionExacta: 'Casa del Libro, Passeig de Gracia, Barcelona',
    },
    {
      _id: ids.eventos[5],
      title: 'Presentacion cancelada',
      description: 'Evento desactivado para comprobar la moderacion.',
      creator: ids.usuarios[6],
      participant: [],
      eventDate: date('2026-06-20'),
      createdDate: date('2026-04-01'),
      location: { type: 'Point', coordinates: [2.15, 41.38] },
      direccionExacta: 'Barcelona',
      IsDeleted: true,
    },
  ]);

  const postBookIndexes = [0, 1, 2, 3, 4, 5, 7, 8, 10, 11, 13, 14];
  await Post.insertMany(
    postBookIndexes.map((bookIndex, index) => ({
      _id: ids.posts[index],
      description: [
        'Libro en excelente estado, leido una sola vez.',
        'Disponible para alquiler durante todo el verano.',
        'Edicion cuidada y sin anotaciones.',
        'Ideal para amantes de la distopia.',
        'Ejemplar con marcas leves de lectura.',
        'Clasico imprescindible para completar biblioteca.',
        'Perfecto para una lectura tranquila de fin de semana.',
        'Poesia y literatura breve en muy buen estado.',
        'Aventura con tapa blanda y paginas cuidadas.',
        'Ensayo divulgativo recomendado para curiosos.',
        'Alquiler corto disponible por semanas.',
        'Publicacion con portada original recuperada por ISBN.',
      ][index],
      status: books[bookIndex].type,
      imageUrl: books[bookIndex].imageUrl,
      ownerId: books[bookIndex].owner,
      bookId: ids.libros[bookIndex],
      price: books[bookIndex].precio,
      IsDeleted: index === 10,
    })),
  );

  await Reserva.insertMany([
    {
      _id: ids.reservas[0],
      libro: ids.libros[3],
      usuarioSolicitante: ids.usuarios[1],
      propietario: ids.usuarios[2],
      estado: 'PENDIENTE',
      fechaSolicitud: date('2026-06-10'),
      fechaLimite: date('2026-06-17'),
    },
    {
      _id: ids.reservas[1],
      libro: ids.libros[8],
      usuarioSolicitante: ids.usuarios[2],
      propietario: ids.usuarios[5],
      estado: 'ACEPTADA',
      fechaSolicitud: date('2026-05-22'),
      fechaLimite: date('2026-06-22'),
    },
    {
      _id: ids.reservas[2],
      libro: ids.libros[1],
      usuarioSolicitante: ids.usuarios[5],
      propietario: ids.usuarios[4],
      estado: 'RECHAZADA',
      fechaSolicitud: date('2026-05-05'),
    },
    {
      _id: ids.reservas[3],
      libro: ids.libros[6],
      usuarioSolicitante: ids.usuarios[4],
      propietario: ids.usuarios[3],
      estado: 'ACEPTADA',
      fechaSolicitud: date('2026-04-18'),
      fechaLimite: date('2026-05-18'),
    },
    {
      _id: ids.reservas[4],
      libro: ids.libros[11],
      usuarioSolicitante: ids.usuarios[2],
      propietario: ids.usuarios[2],
      estado: 'PENDIENTE',
      fechaSolicitud: date('2026-06-12'),
    },
    {
      _id: ids.reservas[5],
      libro: ids.libros[13],
      usuarioSolicitante: ids.usuarios[1],
      propietario: ids.usuarios[5],
      estado: 'PENDIENTE',
      fechaSolicitud: date('2026-06-13'),
      IsDeleted: true,
    },
  ]);

  await Valoracion.insertMany([
    {
      _id: ids.valoraciones[0],
      usuarioAutor: ids.usuarios[1],
      usuarioValorado: ids.usuarios[2],
      libro: ids.libros[3],
      tipoOperacion: 'RESERVA',
      puntuacion: 5,
      comentario: 'Comunicacion rapida y libro exactamente como se describia.',
      reservationId: ids.reservas[0],
    },
    {
      _id: ids.valoraciones[1],
      usuarioAutor: ids.usuarios[2],
      usuarioValorado: ids.usuarios[5],
      libro: ids.libros[8],
      tipoOperacion: 'ALQUILER',
      puntuacion: 4,
      comentario: 'Muy buena experiencia. Repetiria sin duda.',
      reservationId: ids.reservas[1],
    },
    {
      _id: ids.valoraciones[2],
      usuarioAutor: ids.usuarios[4],
      usuarioValorado: ids.usuarios[3],
      libro: ids.libros[6],
      tipoOperacion: 'ALQUILER',
      puntuacion: 5,
      comentario: 'Entrega puntual y ejemplar muy cuidado.',
      reservationId: ids.reservas[3],
    },
    {
      _id: ids.valoraciones[3],
      usuarioAutor: ids.usuarios[3],
      usuarioValorado: ids.usuarios[1],
      libro: ids.libros[2],
      tipoOperacion: 'VENTA',
      puntuacion: 4,
      comentario: 'Todo correcto y trato agradable.',
    },
    {
      _id: ids.valoraciones[4],
      usuarioAutor: ids.usuarios[5],
      usuarioValorado: ids.usuarios[4],
      libro: ids.libros[14],
      tipoOperacion: 'VENTA',
      puntuacion: 3,
      comentario: 'Correcto, aunque la entrega tardo algo mas de lo esperado.',
    },
    {
      _id: ids.valoraciones[5],
      usuarioAutor: ids.usuarios[0],
      usuarioValorado: ids.usuarios[2],
      libro: ids.libros[11],
      tipoOperacion: 'ALQUILER',
      puntuacion: 5,
      comentario: 'Ensayo en perfecto estado.',
    },
    {
      _id: ids.valoraciones[6],
      usuarioAutor: ids.usuarios[6],
      usuarioValorado: ids.usuarios[2],
      libro: ids.libros[10],
      tipoOperacion: 'VENTA',
      puntuacion: 2,
      comentario: 'Valoracion desactivada para probar la moderacion.',
      IsDeleted: true,
    },
  ]);

  await Reto.insertMany([
    {
      _id: ids.retos[0],
      title: 'Primer libro compartido',
      description: 'Publica tu primer libro en ViveBook.',
      type: 'SUBIR_LIBROS',
      objetivo: 1,
      activo: true,
    },
    {
      _id: ids.retos[1],
      title: 'Lector curioso',
      description: 'Alquila tres libros distintos.',
      type: 'ALQUILAR_LIBROS',
      objetivo: 3,
      activo: true,
    },
    {
      _id: ids.retos[2],
      title: 'Biblioteca en crecimiento',
      description: 'Compra cinco libros mediante la plataforma.',
      type: 'COMPRAR_LIBROS',
      objetivo: 5,
      activo: true,
    },
    {
      _id: ids.retos[3],
      title: 'Comunidad lectora',
      description: 'Sigue a cinco usuarios.',
      type: 'SEGUIR_USUARIOS',
      objetivo: 5,
      activo: true,
    },
    {
      _id: ids.retos[4],
      title: 'Agenda cultural',
      description: 'Asiste a dos eventos literarios.',
      type: 'ASISTIR_EVENTOS',
      objetivo: 2,
      activo: true,
    },
    {
      _id: ids.retos[5],
      title: 'Reputacion lectora',
      description: 'Recibe cuatro valoraciones positivas.',
      type: 'RECIBIR_VALORACIONES',
      objetivo: 4,
      activo: false,
    },
  ]);

  await ProgresoReto.insertMany(
    ids.progresos.map((progressId, index) => {
      const retoIndex = index % ids.retos.length;
      const objetivo = [1, 3, 5, 5, 2, 4][retoIndex];
      const progresoActual = Math.min((index % objetivo) + 1, objetivo);
      const completado = progresoActual >= objetivo;

      return {
        _id: progressId,
        usuario: ids.usuarios[(index % 5) + 1],
        reto: ids.retos[retoIndex],
        progresoActual,
        objetivo,
        completado,
        fechaCompletado: completado ? date('2026-05-30') : undefined,
      };
    }),
  );

  console.log('Base de datos de demostracion preparada.');
  console.log(`Usuarios: ${await Usuario.countDocuments()}`);
  console.log(`Autores: ${await Autor.countDocuments()}`);
  console.log(`Libros: ${await Libro.countDocuments()}`);
  console.log(`Eventos: ${await Evento.countDocuments()}`);
  console.log(`Posts: ${await Post.countDocuments()}`);
  console.log(`Reservas: ${await Reserva.countDocuments()}`);
  console.log(`Valoraciones: ${await Valoracion.countDocuments()}`);
  console.log(`Retos: ${await Reto.countDocuments()}`);
  console.log(`Contrasena comun: ${DEMO_PASSWORD}`);
  console.log('Administrador: admin@demo.vivebook.com');
};

populateDB()
  .catch((error: unknown) => {
    console.error('No se pudo poblar la base de datos:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
