# ViveBook Backend

Backend REST para ViveBook, una plataforma orientada a compraventa, alquiler e intercambio de libros entre usuarios, con soporte para eventos, reservas, chat, valoraciones, retos, recomendaciones asistidas por IA y administracion desde BackOffice.

El proyecto esta construido con Node.js, Express, TypeScript y MongoDB mediante Mongoose. Expone una API HTTP documentada con Swagger, usa JWT para autenticacion y cuenta con una suite de tests de integracion basada en Vitest, Supertest y MongoDB en memoria.

## Tabla de Contenidos

- [Caracteristicas](#caracteristicas)
- [Stack Tecnico](#stack-tecnico)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Configuracion](#configuracion)
- [Instalacion](#instalacion)
- [Scripts Disponibles](#scripts-disponibles)
- [Ejecucion Local](#ejecucion-local)
- [Documentacion Swagger](#documentacion-swagger)
- [Testing](#testing)
- [Modelo de Dominio](#modelo-de-dominio)
- [Endpoints Principales](#endpoints-principales)
- [Autenticacion](#autenticacion)
- [Respuestas de la API](#respuestas-de-la-api)
- [Docker](#docker)
- [CI/CD](#cicd)
- [Recomendaciones IA](#recomendaciones-ia)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Buenas Practicas de Desarrollo](#buenas-practicas-de-desarrollo)
- [Troubleshooting](#troubleshooting)

## Caracteristicas

- Registro, login local y login social con Google/Apple.
- Autenticacion mediante JWT.
- CRUD de usuarios, autores, librerias, libros, eventos, posts, reservas, valoraciones y retos.
- Publicacion de libros en modo `VENTA` o `ALQUILER`.
- Compra y alquiler de libros.
- Wishlist y favoritos de usuario.
- Reservas de libros entre solicitante y propietario.
- Solicitudes de mensaje previas a la creacion de un chat privado.
- Chats y mensajes con Socket.IO.
- Sistema de retos y progreso de usuario.
- Valoraciones entre usuarios.
- Integracion con Cloudinary para imagenes.
- Integracion con Matomo.
- Sistema de recomendaciones asistido por IA.
- Preparacion para busqueda vectorial con Weaviate.
- Swagger UI para inspeccionar y probar endpoints.
- Tests de integracion con MongoDB en memoria.
- Dockerfile multi-stage para despliegue.
- Workflow de GitHub Actions para construir y publicar imagen Docker.

## Stack Tecnico

| Area              | Tecnologia                               |
| ----------------- | ---------------------------------------- |
| Runtime           | Node.js 20                               |
| Framework HTTP    | Express                                  |
| Lenguaje          | TypeScript                               |
| Base de datos     | MongoDB                                  |
| ODM               | Mongoose                                 |
| Validacion        | Joi                                      |
| Autenticacion     | JWT                                      |
| Tiempo real       | Socket.IO                                |
| Logging           | Pino, pino-http, pino-pretty             |
| Documentacion API | swagger-jsdoc, swagger-ui-express        |
| Testing           | Vitest, Supertest, mongodb-memory-server |
| Formato y lint    | Prettier, ESLint                         |
| Imagenes          | Cloudinary                               |
| Analitica         | Matomo                                   |
| IA                | Servicio compatible con API de Ollama    |
| Vector DB         | Weaviate client                          |
| Contenedores      | Docker                                   |
| CI/CD             | GitHub Actions                           |

## Arquitectura

El backend esta organizado siguiendo una separacion por capas:

```txt
Request HTTP
   -> routes
   -> middleware
   -> controllers
   -> services
   -> models
   -> MongoDB
```

### Capas

- `src/app.ts`: crea y configura la aplicacion Express. Monta middlewares, Swagger, rutas, `/ping` y manejador 404. Esta separacion permite testear la app sin levantar puerto ni conectar el servidor real.
- `src/server.ts`: arranca la infraestructura: conexion MongoDB, inicializacion de retos/chat global, servidor HTTP, Socket.IO y `listen`.
- `src/routes`: define endpoints y middlewares aplicados a cada ruta.
- `src/controllers`: traduce peticiones HTTP a llamadas de dominio y construye respuestas.
- `src/services`: concentra logica de negocio y acceso a modelos.
- `src/models`: esquemas Mongoose.
- `src/middleware`: validacion, autenticacion y autorizacion.
- `src/library`: utilidades transversales como logging, respuestas API y utilidades de chat.
- `src/config`: lectura y normalizacion de variables de entorno.
- `tests`: suite de integracion automatizada.

## Requisitos

Para desarrollo local:

- Node.js 20 o superior.
- npm.
- MongoDB local o una URI de MongoDB accesible.
- Cuenta y credenciales de Cloudinary, salvo en tests.

Para ejecutar tests:

- Node.js.
- npm.
- No es necesario tener MongoDB instalado: se usa `mongodb-memory-server`.

Para Docker:

- Docker.
- Acceso a Docker Hub si se desea publicar la imagen.

## Configuracion

El proyecto carga variables desde `.env` mediante `dotenv`.

Ejemplo de `.env`:

```env
MONGO_URI=mongodb://localhost:27017/vivebook
SERVER_PORT=1337
SWAGGER_URL=localhost
SWAGGER_PORT=1337

JWT_ACCESS_SECRET=replace-this-access-secret
JWT_REFRESH_SECRET=replace-this-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLOUDINARY_API_KEY=replace-this-cloudinary-key
CLOUDINARY_SECRET=replace-this-cloudinary-secret
CLOUDINARY_NAME=replace-this-cloudinary-name

MATOMO_INSTANCE=https://your-matomo-instance.com
MATOMO_API=your-api-key

WEAVIATE_HOST=localhost
WEAVIATE_PORT=8081
WEAVIATE_SCHEME=http

LLM_BASE_URL=http://localhost:8080
LLM_MODEL=qwen2.5:14b
EMBEDDING_MODEL=embeddinggemma

LOG_LEVEL=info
```

### Variables Principales

| Variable             | Obligatoria | Descripcion                           |
| -------------------- | ----------- | ------------------------------------- |
| `MONGO_URI`          | Si          | URI de conexion a MongoDB.            |
| `SERVER_PORT`        | No          | Puerto HTTP. Por defecto `1337`.      |
| `JWT_ACCESS_SECRET`  | Recomendado | Secreto para firmar tokens de acceso. |
| `JWT_REFRESH_SECRET` | Recomendado | Secreto para refresh tokens.          |
| `CLOUDINARY_API_KEY` | Si          | API key de Cloudinary.                |
| `CLOUDINARY_SECRET`  | Si          | Secret de Cloudinary.                 |
| `CLOUDINARY_NAME`    | Si          | Cloud name de Cloudinary.             |
| `MATOMO_INSTANCE`    | No          | URL de instancia Matomo.              |
| `MATOMO_API`         | No          | API token de Matomo.                  |
| `WEAVIATE_HOST`      | No          | Host de Weaviate.                     |
| `WEAVIATE_PORT`      | No          | Puerto de Weaviate.                   |
| `WEAVIATE_SCHEME`    | No          | `http` o `https`.                     |
| `LLM_BASE_URL`       | No          | URL base del servicio de IA.          |
| `LLM_MODEL`          | No          | Modelo de generacion de texto.        |
| `EMBEDDING_MODEL`    | No          | Modelo de embeddings.                 |
| `LOG_LEVEL`          | No          | Nivel de logs de Pino.                |

Nota: `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET` y `CLOUDINARY_NAME` se validan como obligatorias al importar la configuracion. En tests se inyectan valores dummy desde `tests/setup.ts`.

## Instalacion

```bash
npm install
```

Para entornos CI o instalaciones reproducibles:

```bash
npm ci
```

## Scripts Disponibles

| Script                  | Descripcion                                     |
| ----------------------- | ----------------------------------------------- |
| `npm run go`            | Compila TypeScript y arranca `build/server.js`. |
| `npm run start`         | Arranca la version compilada.                   |
| `npm run build`         | Compila TypeScript en `build/`.                 |
| `npm run lint`          | Ejecuta ESLint.                                 |
| `npm run lint:quiet`    | Ejecuta ESLint mostrando solo errores.          |
| `npm run lint:fix`      | Aplica fixes automaticos de ESLint.             |
| `npm run format`        | Formatea el proyecto con Prettier.              |
| `npm run format:check`  | Comprueba formato con Prettier.                 |
| `npm run populate:db`   | Ejecuta el script de poblado de base de datos.  |
| `npm test`              | Ejecuta tests con Vitest en modo run.           |
| `npm run test:watch`    | Ejecuta Vitest en modo watch.                   |
| `npm run test:coverage` | Ejecuta tests con cobertura.                    |
| `npm run prepare`       | Inicializa Husky.                               |

## Ejecucion Local

1. Crear `.env` con las variables necesarias.
2. Instalar dependencias.
3. Levantar MongoDB.
4. Compilar y arrancar:

```bash
npm run go
```

Por defecto, la API queda disponible en:

```txt
http://localhost:1337
```

Endpoint de salud:

```http
GET /ping
```

Respuesta esperada:

```json
{
  "hello": "world"
}
```

## Documentacion Swagger

Con el servidor levantado:

```txt
http://localhost:1337/swagger
```

Swagger se genera desde los comentarios OpenAPI definidos en `src/routes/**/*.ts` y la configuracion de `src/swagger.ts`.

## Testing

El proyecto incluye tests de integracion con:

- Vitest como runner.
- Supertest para peticiones HTTP contra Express.
- mongodb-memory-server para levantar MongoDB temporal.
- Mongoose conectado a la base temporal en `tests/setup.ts`.

No se usa la base de datos real durante los tests.

### Ejecutar Tests

```bash
npm test
```

Modo watch:

```bash
npm run test:watch
```

Cobertura:

```bash
npm run test:coverage
```

### Configuracion de Tests

Ficheros principales:

- `vitest.config.ts`: configuracion de Vitest.
- `tests/setup.ts`: arranque/cierre de MongoDB en memoria, variables dummy y limpieza entre tests.
- `tests/helpers`: factories y helpers HTTP reutilizables.

Durante tests:

- `NODE_ENV=test`.
- El logger se silencia para evitar ruido en consola.
- MongoDB se levanta en memoria.
- Las colecciones se limpian despues de cada test.

### Cobertura Actual

La suite cubre, entre otros:

- App Express y `/ping`.
- Autenticacion local y social mock.
- Perfil de usuario.
- Autores.
- Librerias.
- Libros.
- Compra y alquiler de libros.
- Wishlist, favoritos y `profile/libros`.
- Reservas.
- Message Requests.

## Modelo de Dominio

### Usuario

Representa una cuenta de la plataforma. Puede publicar libros, comprar, alquilar, guardar wishlist, favoritos, seguir usuarios, participar en eventos y recibir valoraciones.

Campos relevantes:

- `name`
- `email`
- `password`
- `authProvider`
- `rol`
- `libros`
- `boughtLibros`
- `rentedLibros`
- `wishlist`
- `favoriteBooks`
- `favoritos`
- `followingUsers`
- `IsDeleted`

### Libro

Representa un libro publicado por un usuario.

Campos relevantes:

- `isbn`
- `title`
- `authors`
- `autor`
- `categoria`
- `type`: `VENTA` o `ALQUILER`
- `precio`
- `estado`
- `owner`
- `IsDeleted`
- `isReserved`
- `reservedBy`
- `reservationExpiry`

### Autor

Entidad de autor reutilizable por libros.

Campos relevantes:

- `fullName`
- `IsDeleted`

### Libreria

Representa una libreria fisica.

Campos relevantes:

- `name`
- `address`
- `IsDeleted`

### Evento

Evento literario con creador, fecha, ubicacion y participantes.

### Chat y Mensaje

Sistema de conversacion entre usuarios, asociado opcionalmente a libro o evento.

### Reserva

Solicitud para reservar un libro entre un solicitante y el propietario.

Estados:

- `PENDIENTE`
- `ACEPTADA`
- `RECHAZADA`

### MessageRequest

Solicitud previa para abrir un chat sobre un libro entre comprador/interesado y vendedor.

Estados:

- `pending`
- `accepted`
- `denied`

### Reto y ProgresoReto

Sistema de gamificacion que registra progreso de usuarios en objetivos como subir libros, comprar, alquilar o asistir a eventos.

## Endpoints Principales

### Autenticacion

| Metodo | Ruta                   | Descripcion                            |
| ------ | ---------------------- | -------------------------------------- |
| `POST` | `/auth/signup`         | Registro de usuario.                   |
| `POST` | `/auth/admin-signup`   | Registro directo de administrador.     |
| `POST` | `/auth/signin`         | Login local.                           |
| `POST` | `/auth/social-login`   | Login social Google/Apple.             |
| `GET`  | `/auth/profile`        | Perfil autenticado.                    |
| `GET`  | `/auth/profile/libros` | Biblioteca del usuario por categorias. |

### Usuarios

| Metodo   | Ruta                             | Descripcion                |
| -------- | -------------------------------- | -------------------------- |
| `POST`   | `/usuarios`                      | Crear usuario.             |
| `GET`    | `/usuarios`                      | Listar usuarios activos.   |
| `GET`    | `/usuarios/all`                  | Listar todos los usuarios. |
| `GET`    | `/usuarios/search`               | Buscar usuarios.           |
| `GET`    | `/usuarios/:usuarioId`           | Obtener usuario.           |
| `PUT`    | `/usuarios/:usuarioId`           | Actualizar usuario.        |
| `DELETE` | `/usuarios/:usuarioId`           | Borrado logico.            |
| `DELETE` | `/usuarios/permanent/:usuarioId` | Borrado permanente.        |
| `PUT`    | `/usuarios/restore/:usuarioId`   | Restaurar usuario.         |
| `POST`   | `/usuarios/wishlist/:libroId`    | Alternar wishlist.         |
| `POST`   | `/usuarios/favoritos/:libroId`   | Alternar favoriteBooks.    |
| `GET`    | `/usuarios/favoritos`            | Listar favoritos legacy.   |
| `GET`    | `/usuarios/favoritos/:libroId`   | Comprobar favorito legacy. |
| `PUT`    | `/usuarios/favoritos/:libroId`   | Alternar favorito legacy.  |
| `PUT`    | `/usuarios/push-token`           | Actualizar token push.     |

### Autores

| Metodo   | Ruta                        | Descripcion               |
| -------- | --------------------------- | ------------------------- |
| `POST`   | `/autores`                  | Crear autor.              |
| `GET`    | `/autores`                  | Listar autores activos.   |
| `GET`    | `/autores/all`              | Listar todos los autores. |
| `GET`    | `/autores/:autorId`         | Obtener autor.            |
| `PUT`    | `/autores/:autorId`         | Actualizar autor.         |
| `DELETE` | `/autores/:autorId`         | Eliminar autor.           |
| `PUT`    | `/autores/restore/:autorId` | Restaurar autor.          |

### Librerias

| Metodo   | Ruta                               | Descripcion          |
| -------- | ---------------------------------- | -------------------- |
| `POST`   | `/librerias`                       | Crear libreria.      |
| `GET`    | `/librerias`                       | Listar librerias.    |
| `GET`    | `/librerias/:libreriaId`           | Obtener libreria.    |
| `PUT`    | `/librerias/:libreriaId`           | Actualizar libreria. |
| `DELETE` | `/librerias/:libreriaId`           | Desactivar libreria. |
| `POST`   | `/librerias/:libreriaId/restaurar` | Restaurar libreria.  |

### Libros

| Metodo   | Ruta                       | Descripcion                     |
| -------- | -------------------------- | ------------------------------- |
| `POST`   | `/libros`                  | Crear libro. Requiere JWT.      |
| `GET`    | `/libros`                  | Listar libros activos.          |
| `GET`    | `/libros/all`              | Listar todos los libros.        |
| `GET`    | `/libros/search`           | Buscar libros por titulo.       |
| `GET`    | `/libros/type/:type`       | Listar libros por tipo.         |
| `GET`    | `/libros/:libroId`         | Obtener libro.                  |
| `PUT`    | `/libros/:libroId`         | Actualizar libro.               |
| `DELETE` | `/libros/:libroId`         | Eliminar libro.                 |
| `PUT`    | `/libros/restore/:libroId` | Restaurar libro.                |
| `GET`    | `/libros/isbn/:isbn`       | Crear/obtener libro desde ISBN. |
| `POST`   | `/libros/buy/:libroId`     | Comprar libro. Requiere JWT.    |
| `POST`   | `/libros/rent/:libroId`    | Alquilar libro. Requiere JWT.   |

### Reservas

| Metodo   | Ruta                            | Descripcion                             |
| -------- | ------------------------------- | --------------------------------------- |
| `POST`   | `/reservas`                     | Solicitar reserva.                      |
| `POST`   | `/reservas/aceptar/:reservaId`  | Aceptar reserva.                        |
| `POST`   | `/reservas/rechazar/:reservaId` | Rechazar reserva.                       |
| `GET`    | `/reservas/solicitadas`         | Reservas solicitadas por el usuario.    |
| `GET`    | `/reservas/recibidas`           | Reservas recibidas como propietario.    |
| `DELETE` | `/reservas/:reservaId`          | Ocultar reserva para el usuario actual. |

### Message Requests

| Metodo  | Ruta                            | Descripcion                                |
| ------- | ------------------------------- | ------------------------------------------ |
| `POST`  | `/message-requests`             | Solicitar abrir conversacion por un libro. |
| `GET`   | `/message-requests/received`    | Solicitudes recibidas.                     |
| `GET`   | `/message-requests/sent`        | Solicitudes enviadas.                      |
| `PATCH` | `/message-requests/:id/accept`  | Aceptar solicitud y crear chat.            |
| `PATCH` | `/message-requests/:id/deny`    | Denegar solicitud.                         |
| `PATCH` | `/message-requests/:id/dismiss` | Descartar solicitud.                       |

### Chats y Mensajes

| Recurso     | Descripcion          |
| ----------- | -------------------- |
| `/chats`    | Gestion de chats.    |
| `/mensajes` | Gestion de mensajes. |

### Otros Recursos

| Recurso            | Descripcion                          |
| ------------------ | ------------------------------------ |
| `/eventos`         | Eventos literarios.                  |
| `/posts`           | Publicaciones.                       |
| `/valoraciones`    | Valoraciones entre usuarios.         |
| `/retos`           | Retos y progreso.                    |
| `/image`           | Imagenes y Cloudinary.               |
| `/matomo`          | Analitica Matomo.                    |
| `/recomendaciones` | Recomendaciones IA.                  |
| `/admin/*`         | Rutas administrativas de BackOffice. |

## Autenticacion

Las rutas protegidas esperan un header:

```http
Authorization: Bearer <token>
```

El token se obtiene en:

```http
POST /auth/signin
POST /auth/signup
POST /auth/social-login
```

Ejemplo de login:

```http
POST /auth/signin
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Respuesta:

```json
{
  "success": true,
  "status": 200,
  "message": "Autenticacion exitosa",
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "rol": "User"
    },
    "token": "..."
  }
}
```

El token tambien se devuelve en la cabecera `auth-token` por compatibilidad.

## Respuestas de la API

Gran parte de la API usa un formato normalizado mediante `sendSuccess` y `sendError`.

### Exito

```json
{
  "success": true,
  "status": 200,
  "message": "Operacion realizada con exito",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "status": 404,
  "message": "Recurso no encontrado",
  "code": "NOT_FOUND",
  "errors": null
}
```

Codigos usados:

- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `VALIDATION_ERROR`
- `INTERNAL_ERROR`

Nota: algunas rutas legacy pueden devolver respuestas no normalizadas. La tendencia del proyecto es migrarlas progresivamente al formato comun.

## Docker

El proyecto incluye un Dockerfile multi-stage:

1. `build`: instala dependencias y compila TypeScript.
2. `production`: instala dependencias de produccion y copia `build/`.

Construir imagen:

```bash
docker build -t vivebook-backend .
```

Ejecutar contenedor:

```bash
docker run --env-file .env -p 1337:1337 vivebook-backend
```

La aplicacion escucha en el puerto `1337` por defecto.

## CI/CD

Existe un workflow en:

```txt
.github/workflows/main.yml
```

Funcion actual:

- Se ejecuta en push a `main`.
- Tambien se puede lanzar manualmente con `workflow_dispatch`.
- El job de Docker solo continua si:
  - el evento es manual, o
  - el mensaje del commit empieza por `v`.
- Publica la imagen en Docker Hub con el tag:

```txt
<DOCKER_HUB_USERNAME>/vivebook-backend-ea:latest
```

Secrets requeridos en GitHub:

- `DOCKER_HUB_USERNAME`
- `DOCKER_HUB_ACCESS_TOKEN`

## Recomendaciones IA

El backend incluye un modulo de recomendaciones asistidas por IA.

Ficheros relevantes:

- `src/services/AI.ts`
- `src/services/Recomendacion.ts`
- `src/controllers/Recomendacion.ts`
- `src/routes/Recomendacion.ts`
- `src/services/Weaviate.ts`

Endpoint principal:

```http
POST /recomendaciones
```

Flujo:

1. El usuario envia una consulta en `query`.
2. Opcionalmente envia `context`.
3. Si no hay contexto, el backend busca libros en MongoDB.
4. Se genera un prompt.
5. Se envia el prompt al servicio IA configurado.
6. Se devuelve recomendacion y contexto usado.

Ejemplo sin contexto:

```json
{
  "query": "Recomiendame un libro de programacion barato",
  "limit": 5
}
```

Ejemplo con contexto:

```json
{
  "query": "Recomiendame el mejor libro de esta lista",
  "context": [
    {
      "title": "Clean Code",
      "text": "Titulo: Clean Code\nAutor: Robert C. Martin\nCategoria: programacion\nTipo: VENTA\nPrecio: 12\nEstado: usado"
    }
  ]
}
```

Healthcheck:

```http
GET /recomendaciones/health
```

Script manual:

```bash
npx ts-node test-recomendacion.ts
```

### Weaviate

`src/services/Weaviate.ts` contiene funciones base para:

- comprobar conexion,
- crear esquema de libros,
- indexar libros,
- buscar mediante vector search.

Actualmente, el flujo principal de recomendaciones puede funcionar usando MongoDB como fuente de contexto.

## Estructura del Proyecto

```txt
.
├── .github/
│   └── workflows/
│       └── main.yml
├── .husky/
│   └── pre-commit
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── controllers/
│   ├── library/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   │   └── admin/
│   ├── services/
│   └── swagger.ts
├── tests/
│   ├── helpers/
│   ├── setup.ts
│   └── *.test.ts
├── Dockerfile
├── eslint.config.mts
├── package.json
├── package-lock.json
├── tsconfig.json
└── vitest.config.ts
```

## Buenas Practicas de Desarrollo

### Antes de subir cambios

Ejecutar:

```bash
npm run build
npm run lint
npm test
```

### Pre-commit

El hook de Husky ejecuta:

```bash
npm run format
npm run lint
```

Esto formatea el codigo y valida reglas de lint antes de confirmar cambios.

### Tests Recomendados para Nuevas Funcionalidades

Para cada nuevo recurso o flujo:

1. Crear helper en `tests/helpers`.
2. Crear una suite `tests/<recurso>.test.ts`.
3. Cubrir camino feliz.
4. Cubrir validaciones Joi.
5. Cubrir errores de autenticacion/autorizacion.
6. Cubrir estados inexistentes o IDs invalidos.
7. Verificar efectos persistidos en MongoDB.

## Troubleshooting

### Error de Cloudinary al arrancar

Si aparece un error indicando que falta una variable obligatoria:

```txt
La variable de entorno obligatoria CLOUDINARY_API_KEY no esta configurada.
```

Revisar `.env` y definir:

```env
CLOUDINARY_API_KEY=...
CLOUDINARY_SECRET=...
CLOUDINARY_NAME=...
```

### La API no conecta a MongoDB

Comprobar:

- que `MONGO_URI` esta definida,
- que MongoDB esta levantado,
- que la URI es accesible desde el entorno donde corre Node/Docker.

### Swagger no muestra rutas esperadas

Swagger genera documentacion a partir de los comentarios OpenAPI. Si una ruta no aparece:

- revisar comentarios en `src/routes`,
- comprobar que el proyecto se ha compilado,
- revisar `src/swagger.ts`.

### Tests muestran warnings de dependencias

Durante los tests pueden aparecer warnings de dependencias externas como `punycode` o `url.parse`. No son logs de la aplicacion y no hacen fallar la suite.

### `mongodb-memory-server` falla en CI

En la primera ejecucion puede necesitar descargar binarios de MongoDB. Si falla:

- revisar conectividad de red del runner,
- comprobar version de Node,
- comprobar que no haya restricciones de descarga.

## Estado Actual de Calidad

Comandos verificados durante el desarrollo de la suite:

```bash
npm test
npm run build
npm run lint
```

La suite actual ejecuta tests de integracion sobre Express + MongoDB en memoria y cubre los flujos principales de negocio del backend..
