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

const DEMO_PASSWORD = 'ViveBook123!';

const objectId = (group: number, index: number): Types.ObjectId =>
  new Types.ObjectId(
    `${group.toString(16).padStart(2, '0')}${index.toString(16).padStart(22, '0')}`,
  );

const ids = {
  autores: Array.from({ length: 8 }, (_, index) => objectId(0xa1, index + 1)),
  usuarios: Array.from({ length: 8 }, (_, index) => objectId(0xb1, index + 1)),
  libros: Array.from({ length: 16 }, (_, index) => objectId(0xc1, index + 1)),
  librerias: Array.from({ length: 4 }, (_, index) => objectId(0xd1, index + 1)),
  eventos: Array.from({ length: 5 }, (_, index) => objectId(0xe1, index + 1)),
  posts: Array.from({ length: 8 }, (_, index) => objectId(0xf1, index + 1)),
  reservas: Array.from({ length: 5 }, (_, index) => objectId(0xa2, index + 1)),
  valoraciones: Array.from({ length: 6 }, (_, index) => objectId(0xb2, index + 1)),
  retos: Array.from({ length: 6 }, (_, index) => objectId(0xc2, index + 1)),
  progresos: Array.from({ length: 10 }, (_, index) => objectId(0xd2, index + 1)),
};

const date = (value: string): Date => new Date(`${value}T10:00:00.000Z`);

const populateDB = async (): Promise<void> => {
  if (!config.mongo.url) {
    throw new Error('MONGO_URI no está configurada.');
  }

  await mongoose.connect(config.mongo.url, { retryWrites: true, w: 'majority' });
  console.log(`Conectado a ${mongoose.connection.name}.`);

  await ProgresoReto.deleteMany({ _id: { $in: ids.progresos } });
  await Valoracion.deleteMany({ _id: { $in: ids.valoraciones } });
  await Reserva.deleteMany({ _id: { $in: ids.reservas } });
  await Post.deleteMany({ _id: { $in: ids.posts } });
  await Evento.deleteMany({ _id: { $in: ids.eventos } });
  await Libro.deleteMany({ _id: { $in: ids.libros } });
  await Usuario.deleteMany({ _id: { $in: ids.usuarios } });
  await Autor.deleteMany({ _id: { $in: ids.autores } });
  await Libreria.deleteMany({ _id: { $in: ids.librerias } });
  await Reto.deleteMany({ _id: { $in: ids.retos } });

  const password = await bcrypt.hash(DEMO_PASSWORD, 10);

  await Autor.insertMany([
    { _id: ids.autores[0], fullName: 'Clara Montes', createdAt: date('2024-01-12') },
    { _id: ids.autores[1], fullName: 'Hugo Valdés', createdAt: date('2024-02-03') },
    { _id: ids.autores[2], fullName: 'Elena Robles', createdAt: date('2024-03-18') },
    { _id: ids.autores[3], fullName: 'Martín Soler', createdAt: date('2024-04-25') },
    { _id: ids.autores[4], fullName: 'Irene Vidal', createdAt: date('2024-06-09') },
    { _id: ids.autores[5], fullName: 'Samuel Costa', createdAt: date('2024-08-14') },
    { _id: ids.autores[6], fullName: 'Nora Campos', createdAt: date('2024-10-20') },
    {
      _id: ids.autores[7],
      fullName: 'Adrián Vega',
      IsDeleted: true,
      createdAt: date('2023-11-02'),
    },
  ]);

  await Usuario.insertMany([
    {
      _id: ids.usuarios[0],
      name: 'Administradora ViveBook',
      email: 'admin.demo@vivebook.test',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=47',
      rol: 'Admin',
      description: 'Cuenta administrativa de demostración para revisar el BackOffice.',
      hasSeenTutorial: true,
      favoriteAuthors: ['Clara Montes', 'Elena Robles'],
      favoriteCategories: ['Narrativa', 'Historia'],
      createdAt: date('2023-09-10'),
    },
    {
      _id: ids.usuarios[1],
      name: 'Lucía Ferrer',
      email: 'lucia.demo@vivebook.test',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=32',
      rol: 'User',
      description: 'Lectora de narrativa contemporánea y organizadora de clubes de lectura.',
      hasSeenTutorial: true,
      favoriteAuthors: ['Clara Montes', 'Irene Vidal'],
      favoriteCategories: ['Narrativa', 'Romance'],
      createdAt: date('2024-01-16'),
    },
    {
      _id: ids.usuarios[2],
      name: 'Diego Navarro',
      email: 'diego.demo@vivebook.test',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=12',
      rol: 'User',
      description: 'Interesado en ciencia ficción, ensayo y tecnología.',
      hasSeenTutorial: true,
      favoriteAuthors: ['Hugo Valdés', 'Samuel Costa'],
      favoriteCategories: ['Ciencia ficción', 'Ensayo'],
      createdAt: date('2024-02-22'),
    },
    {
      _id: ids.usuarios[3],
      name: 'Marta Pons',
      email: 'marta.demo@vivebook.test',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=44',
      rol: 'User',
      description: 'Coleccionista de novela histórica y biografías.',
      hasSeenTutorial: false,
      favoriteAuthors: ['Martín Soler'],
      favoriteCategories: ['Historia', 'Biografía'],
      createdAt: date('2024-04-08'),
    },
    {
      _id: ids.usuarios[4],
      name: 'Álex Romero',
      email: 'alex.demo@vivebook.test',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=15',
      rol: 'User',
      description: 'Comparte libros juveniles, cómic y fantasía.',
      hasSeenTutorial: true,
      favoriteAuthors: ['Nora Campos'],
      favoriteCategories: ['Fantasía', 'Juvenil'],
      createdAt: date('2024-07-01'),
    },
    {
      _id: ids.usuarios[5],
      name: 'Sofía Blanco',
      email: 'sofia.demo@vivebook.test',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=25',
      rol: 'User',
      description: 'Busca recomendaciones de poesía y literatura breve.',
      hasSeenTutorial: true,
      favoriteAuthors: ['Elena Robles'],
      favoriteCategories: ['Poesía', 'Relato'],
      createdAt: date('2024-09-13'),
    },
    {
      _id: ids.usuarios[6],
      name: 'Pablo Serra',
      email: 'pablo.demo@vivebook.test',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=5',
      rol: 'User',
      description: 'Usuario de demostración con cuenta desactivada.',
      IsDeleted: true,
      hasSeenTutorial: false,
      favoriteCategories: ['Ensayo'],
      createdAt: date('2023-12-04'),
    },
    {
      _id: ids.usuarios[7],
      name: 'Gestora Editorial',
      email: 'gestora.demo@vivebook.test',
      password,
      authProvider: 'local',
      avatar: 'https://i.pravatar.cc/300?img=49',
      rol: 'Admin',
      description: 'Segunda cuenta administrativa para visualizar distintos roles.',
      hasSeenTutorial: true,
      favoriteCategories: ['Narrativa', 'Poesía', 'Ensayo'],
      createdAt: date('2025-01-09'),
    },
  ]);

  const bookDefinitions = [
    ['9788400000001', 'El jardín de las horas', [0], 'Narrativa', 'VENTA', 18.9, 1],
    ['9788400000002', 'Órbita de ceniza', [1], 'Ciencia ficción', 'ALQUILER', 6.5, 2],
    ['9788400000003', 'Cartas desde el norte', [2], 'Romance', 'VENTA', 16.75, 1],
    ['9788400000004', 'La ciudad sumergida', [3], 'Historia', 'ALQUILER', 7.25, 3],
    ['9788400000005', 'Manual para días imposibles', [4], 'Ensayo', 'VENTA', 21.0, 5],
    ['9788400000006', 'Los mapas del silencio', [0, 4], 'Narrativa', 'VENTA', 19.5, 1],
    ['9788400000007', 'Código de estrellas', [5], 'Ciencia ficción', 'ALQUILER', 5.9, 2],
    ['9788400000008', 'El archivo de invierno', [3], 'Misterio', 'VENTA', 17.4, 3],
    ['9788400000009', 'Cuentos para volver', [2], 'Relato', 'ALQUILER', 4.95, 5],
    ['9788400000010', 'La última biblioteca', [6], 'Fantasía', 'VENTA', 22.0, 4],
    ['9788400000011', 'Breve atlas de la memoria', [4], 'Ensayo', 'VENTA', 15.3, 0],
    ['9788400000012', 'Después de la lluvia', [0], 'Narrativa', 'ALQUILER', 6.0, 1],
    ['9788400000013', 'Historia de una plaza', [3], 'Historia', 'VENTA', 24.5, 3],
    ['9788400000014', 'Versos de medianoche', [2], 'Poesía', 'VENTA', 14.2, 5],
    ['9788400000015', 'El reino de cristal', [6], 'Juvenil', 'ALQUILER', 5.5, 4],
    ['9788400000016', 'Tecnología con propósito', [5], 'Tecnología', 'VENTA', 26.0, 2],
  ] as const;
  const authorNames = [
    'Clara Montes',
    'Hugo Valdés',
    'Elena Robles',
    'Martín Soler',
    'Irene Vidal',
    'Samuel Costa',
    'Nora Campos',
  ];

  await Libro.insertMany(
    bookDefinitions.map(
      ([isbn, title, authorIndexes, categoria, type, precio, ownerIndex], index) => ({
        _id: ids.libros[index],
        isbn,
        title,
        authors: authorIndexes.map((authorIndex) => ids.autores[authorIndex]),
        autor: authorIndexes.map((authorIndex) => authorNames[authorIndex]).join(', '),
        categoria,
        type,
        precio,
        estado: index === 7 ? 'NO_DISPONIBLE' : 'DISPONIBLE',
        owner: ids.usuarios[ownerIndex],
        imageUrl: `https://picsum.photos/seed/vivebook-${index + 1}/600/900`,
        isReserved: index === 3 || index === 8,
        reservedBy: index === 3 ? ids.usuarios[1] : index === 8 ? ids.usuarios[2] : undefined,
        reservationExpiry: index === 3 || index === 8 ? date('2026-07-01') : undefined,
        IsDeleted: index === 15,
        createdAt: date(`2025-${String((index % 9) + 1).padStart(2, '0')}-12`),
      }),
    ),
  );

  await Promise.all([
    Usuario.findByIdAndUpdate(ids.usuarios[0], {
      libros: [ids.libros[10]],
      boughtLibros: [ids.libros[0], ids.libros[4]],
      rentedLibros: [ids.libros[6]],
      favoriteBooks: [ids.libros[0], ids.libros[13]],
      wishlist: [ids.libros[9], ids.libros[15]],
      favoritos: [ids.libros[5]],
      followingUsers: [ids.usuarios[1], ids.usuarios[7]],
      notificationUsersEnabled: [ids.usuarios[1]],
    }),
    Usuario.findByIdAndUpdate(ids.usuarios[1], {
      libros: [ids.libros[0], ids.libros[2], ids.libros[5], ids.libros[11]],
      boughtLibros: [ids.libros[9], ids.libros[13]],
      rentedLibros: [ids.libros[1], ids.libros[8]],
      favoriteBooks: [ids.libros[5], ids.libros[13]],
      wishlist: [ids.libros[4], ids.libros[12]],
      favoritos: [ids.libros[0], ids.libros[2]],
      followingUsers: [ids.usuarios[2], ids.usuarios[5]],
      notificationUsersEnabled: [ids.usuarios[2], ids.usuarios[5]],
    }),
    Usuario.findByIdAndUpdate(ids.usuarios[2], {
      libros: [ids.libros[1], ids.libros[6], ids.libros[15]],
      boughtLibros: [ids.libros[10]],
      rentedLibros: [ids.libros[3]],
      favoriteBooks: [ids.libros[1], ids.libros[15]],
      wishlist: [ids.libros[6]],
      favoritos: [ids.libros[10]],
      followingUsers: [ids.usuarios[1]],
      notificationUsersEnabled: [ids.usuarios[1]],
    }),
    Usuario.findByIdAndUpdate(ids.usuarios[3], {
      libros: [ids.libros[3], ids.libros[7], ids.libros[12]],
      boughtLibros: [ids.libros[3], ids.libros[12]],
      rentedLibros: [],
      favoriteBooks: [ids.libros[12]],
      wishlist: [ids.libros[7]],
      favoritos: [ids.libros[3]],
      followingUsers: [ids.usuarios[1]],
    }),
    Usuario.findByIdAndUpdate(ids.usuarios[4], {
      libros: [ids.libros[9], ids.libros[14]],
      rentedLibros: [ids.libros[14]],
      favoriteBooks: [ids.libros[9], ids.libros[14]],
      wishlist: [ids.libros[1]],
      favoritos: [ids.libros[9]],
      followingUsers: [ids.usuarios[2], ids.usuarios[5]],
    }),
    Usuario.findByIdAndUpdate(ids.usuarios[5], {
      libros: [ids.libros[4], ids.libros[8], ids.libros[13]],
      boughtLibros: [ids.libros[13]],
      favoriteBooks: [ids.libros[8], ids.libros[13]],
      wishlist: [ids.libros[2]],
      favoritos: [ids.libros[8]],
      followingUsers: [ids.usuarios[1], ids.usuarios[3]],
    }),
  ]);

  await Libreria.insertMany([
    {
      _id: ids.librerias[0],
      name: 'Librería Horizonte',
      address: 'Carrer de Mallorca, 184, Barcelona',
    },
    {
      _id: ids.librerias[1],
      name: 'La Página Azul',
      address: 'Carrer Gran de Gràcia, 72, Barcelona',
    },
    {
      _id: ids.librerias[2],
      name: 'Punto y Aparte',
      address: 'Rambla de Catalunya, 41, Barcelona',
    },
    {
      _id: ids.librerias[3],
      name: 'El Rincón del Lector',
      address: 'Carrer de Sants, 125, Barcelona',
      IsDeleted: true,
    },
  ]);

  await Evento.insertMany([
    {
      _id: ids.eventos[0],
      title: 'Club de lectura: narrativa contemporánea',
      description: 'Encuentro mensual para comentar El jardín de las horas.',
      creator: ids.usuarios[1],
      participant: [ids.usuarios[1], ids.usuarios[2], ids.usuarios[5]],
      eventDate: date('2026-07-18'),
      createdDate: date('2026-05-20'),
      location: { type: 'Point', coordinates: [2.163, 41.39] },
      direccionExacta: 'Biblioteca Jaume Fuster, Barcelona',
    },
    {
      _id: ids.eventos[1],
      title: 'Intercambio de ciencia ficción',
      description: 'Trae un libro y llévate otra historia para descubrir.',
      creator: ids.usuarios[2],
      participant: [ids.usuarios[2], ids.usuarios[4]],
      eventDate: date('2026-08-02'),
      createdDate: date('2026-05-25'),
      location: { type: 'Point', coordinates: [2.175, 41.385] },
      direccionExacta: 'Centre Cívic Pati Llimona, Barcelona',
    },
    {
      _id: ids.eventos[2],
      title: 'Taller de poesía breve',
      description: 'Lectura y creación de poemas en formato breve.',
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
      description: 'Paseo por escenarios presentes en novelas históricas.',
      creator: ids.usuarios[3],
      participant: [ids.usuarios[0], ids.usuarios[1], ids.usuarios[3]],
      eventDate: date('2026-10-04'),
      createdDate: date('2026-06-05'),
      location: { type: 'Point', coordinates: [2.176, 41.382] },
      direccionExacta: 'Plaça de Sant Jaume, Barcelona',
    },
    {
      _id: ids.eventos[4],
      title: 'Presentación cancelada',
      description: 'Evento de demostración desactivado.',
      creator: ids.usuarios[6],
      participant: [],
      eventDate: date('2026-06-20'),
      createdDate: date('2026-04-01'),
      location: { type: 'Point', coordinates: [2.15, 41.38] },
      direccionExacta: 'Barcelona',
      IsDeleted: true,
    },
  ]);

  await Post.insertMany(
    [0, 1, 2, 3, 4, 5, 9, 15].map((bookIndex, index) => ({
      _id: ids.posts[index],
      description: [
        'Libro en excelente estado, leído una sola vez.',
        'Disponible para alquiler durante todo el verano.',
        'Edición cuidada y sin anotaciones.',
        'Ideal para amantes de la novela histórica.',
        'Ensayo muy recomendable y actualizado.',
        'Busco darle una segunda vida a este libro.',
        'Fantasía juvenil en perfecto estado.',
        'Publicación desactivada de demostración.',
      ][index],
      status: index === 7 ? 'NO_DISPONIBLE' : index % 2 === 0 ? 'VENTA' : 'ALQUILER',
      imageUrl: `https://picsum.photos/seed/post-${index + 1}/800/600`,
      ownerId: ids.usuarios[[1, 2, 1, 3, 5, 1, 4, 2][index]],
      bookId: ids.libros[bookIndex],
      price: [18.9, 6.5, 16.75, 7.25, 21, 19.5, 22, 26][index],
      IsDeleted: index === 7,
    })),
  );

  await Reserva.insertMany([
    {
      _id: ids.reservas[0],
      libro: ids.libros[3],
      usuarioSolicitante: ids.usuarios[1],
      propietario: ids.usuarios[3],
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
      libro: ids.libros[14],
      usuarioSolicitante: ids.usuarios[5],
      propietario: ids.usuarios[4],
      estado: 'RECHAZADA',
      fechaSolicitud: date('2026-05-05'),
    },
    {
      _id: ids.reservas[3],
      libro: ids.libros[1],
      usuarioSolicitante: ids.usuarios[4],
      propietario: ids.usuarios[2],
      estado: 'ACEPTADA',
      fechaSolicitud: date('2026-04-18'),
      fechaLimite: date('2026-05-18'),
    },
    {
      _id: ids.reservas[4],
      libro: ids.libros[11],
      usuarioSolicitante: ids.usuarios[2],
      propietario: ids.usuarios[1],
      estado: 'PENDIENTE',
      fechaSolicitud: date('2026-06-12'),
      IsDeleted: true,
    },
  ]);

  await Valoracion.insertMany([
    {
      _id: ids.valoraciones[0],
      usuarioAutor: ids.usuarios[1],
      usuarioValorado: ids.usuarios[3],
      libro: ids.libros[3],
      tipoOperacion: 'RESERVA',
      puntuacion: 5,
      comentario: 'Comunicación rápida y libro exactamente como se describía.',
      reservationId: ids.reservas[0],
    },
    {
      _id: ids.valoraciones[1],
      usuarioAutor: ids.usuarios[2],
      usuarioValorado: ids.usuarios[5],
      libro: ids.libros[8],
      tipoOperacion: 'ALQUILER',
      puntuacion: 4,
      comentario: 'Muy buena experiencia. Repetiría sin duda.',
      reservationId: ids.reservas[1],
    },
    {
      _id: ids.valoraciones[2],
      usuarioAutor: ids.usuarios[4],
      usuarioValorado: ids.usuarios[2],
      libro: ids.libros[1],
      tipoOperacion: 'ALQUILER',
      puntuacion: 5,
      comentario: 'Entrega puntual y ejemplar muy cuidado.',
      reservationId: ids.reservas[3],
    },
    {
      _id: ids.valoraciones[3],
      usuarioAutor: ids.usuarios[3],
      usuarioValorado: ids.usuarios[1],
      libro: ids.libros[0],
      tipoOperacion: 'VENTA',
      puntuacion: 4,
      comentario: 'Todo correcto y trato agradable.',
    },
    {
      _id: ids.valoraciones[4],
      usuarioAutor: ids.usuarios[5],
      usuarioValorado: ids.usuarios[4],
      libro: ids.libros[9],
      tipoOperacion: 'VENTA',
      puntuacion: 3,
      comentario: 'Correcto, aunque el envío tardó algo más de lo esperado.',
    },
    {
      _id: ids.valoraciones[5],
      usuarioAutor: ids.usuarios[6],
      usuarioValorado: ids.usuarios[2],
      libro: ids.libros[15],
      tipoOperacion: 'VENTA',
      puntuacion: 2,
      comentario: 'Valoración desactivada para probar la moderación.',
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
      title: 'Reto de temporada finalizado',
      description: 'Reto inactivo para comprobar su representación.',
      type: 'RECIBIR_VALORACIONES',
      objetivo: 4,
      activo: false,
    },
  ]);

  await ProgresoReto.insertMany(
    ids.progresos.map((progressId, index) => {
      const retoIndex = (index + Math.floor(index / 5)) % 5;
      const objetivo = [1, 3, 5, 5, 2][retoIndex];
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

  console.log('Base de datos de demostración preparada.');
  console.log(`Usuarios: ${ids.usuarios.length}`);
  console.log(`Libros: ${ids.libros.length}`);
  console.log(`Contraseña común: ${DEMO_PASSWORD}`);
  console.log('Administrador: admin.demo@vivebook.test');
};

populateDB()
  .catch((error: unknown) => {
    console.error('No se pudo poblar la base de datos:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
