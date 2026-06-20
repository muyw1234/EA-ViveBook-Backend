import express from 'express';
import controller from '../controllers/Libro';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { TokenValidation, OptionalTokenValidation } from '../middleware/verifyToken';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Libros
 *     description: Endpoints CRUD de libros
 *
 * components:
 *   schemas:
 *
 *     Author:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ObjectId del autor
 *           example: "6a060eff9e1aee14101f6cda"
 *         fullName:
 *           type: string
 *           description: Nombre completo del autor
 *           example: "Robert C. Martin"
 *
 *     Libro:
 *       type: object
 *       description: Representa un libro en la base de datos
 *       properties:
 *         _id:
 *           type: string
 *           description: ObjectId de MongoDB
 *           example: "6a060eff9e1aee14101f6cdd"
 *
 *         isbn:
 *           type: string
 *           description: ISBN del libro
 *           example: "9780132350884"
 *
 *         title:
 *           type: string
 *           description: Título del libro
 *           example: "Clean Code"
 *
 *         authors:
 *           type: array
 *           description: Lista de autores asociados
 *           items:
 *             $ref: '#/components/schemas/Author'
 *
 *         type:
 *           type: string
 *           enum:
 *             - VENTA
 *             - ALQUILER
 *           description: Tipo de libro
 *           example: "VENTA"
 *
 *         precio:
 *           type: number
 *           format: float
 *           description: Precio del libro
 *           example: 12
 *
 *         estado:
 *           type: string
 *           enum:
 *             - nuevo
 *             - usado
 *           description: Estado del libro
 *           example: "nuevo"
 *
 *         IsDeleted:
 *           type: boolean
 *           description: Indica si el libro fue eliminado lógicamente
 *           example: false
 *
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *           example: "2026-05-14T18:05:51.806Z"
 *
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de actualización
 *           example: "2026-05-14T18:05:51.806Z"
 *
 *     LibroCreateUpdate:
 *       type: object
 *       description: Datos necesarios para crear o actualizar un libro
 *       required:
 *         - isbn
 *         - title
 *         - authors
 *         - type
 *         - precio
 *         - estado
 *
 *       properties:
 *         isbn:
 *           type: string
 *           description: ISBN del libro
 *           example: "9780132350884"
 *
 *         title:
 *           type: string
 *           description: Título del libro
 *           example: "Clean Code"
 *
 *         authors:
 *           type: array
 *           description: Lista de IDs de autores
 *           items:
 *             type: string
 *             pattern: '^[0-9a-fA-F]{24}$'
 *             example: "6a060eff9e1aee14101f6cda"
 *
 *         type:
 *           type: string
 *           enum:
 *             - VENTA
 *             - ALQUILER
 *           description: Tipo de publicación
 *           example: "VENTA"
 *
 *         precio:
 *           type: number
 *           format: float
 *           description: Precio del libro
 *           example: 12
 *
 *         estado:
 *           type: string
 *           enum:
 *             - nuevo
 *             - usado
 *           description: Estado del libro
 *           example: "nuevo"
 *
 *         IsDeleted:
 *           type: boolean
 *           description: Eliminación lógica
 *           example: false
 */

/**
 * @openapi
 * /libros:
 *   post:
 *     summary: Crear un libro
 *     description: Crea un nuevo libro en la base de datos.
 *     tags:
 *       - Libros
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LibroCreateUpdate'
 *     responses:
 *       201:
 *         description: Libro creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Libro'
 *       422:
 *         description: Error de validación en los datos enviados
 */
router.post('/', TokenValidation, ValidateJoi(Schemas.libro.create), controller.createLibro);

/**
 * @openapi
 * /libros/all:
 *   get:
 *     summary: Listar todos los libros
 *     description: Recupera la lista completa de libros registrados.
 *     tags:
 *       - Libros
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Numero de pagina a consultar
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 2
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Cantidad maxima de elementos por pagina
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           example: 3
 *     responses:
 *       200:
 *         description: Lista paginada de libros obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Libro'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 2
 *                     limit:
 *                       type: integer
 *                       example: 3
 *                     totalPages:
 *                       type: integer
 *                       example: 9
 *       500:
 *         description: Error interno del servidor
 */
router.get('/all', controller.getAllLibros);

// Segun Gemini, esto debe estar arriba para que no colisione con la busqueda por id
/**
 * @openapi
 * /libros/search:
 *   get:
 *     summary: Buscar libros por título
 *     description: Retorna una lista de libros cuyo título coincida parcial o totalmente con el término de búsqueda. Incluye paginación.
 *     tags:
 *       - Libros
 *     parameters:
 *       - in: query
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *         description: Término o palabra clave para buscar en el título del libro.
 *         example: "Clean"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para la paginación.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de resultados por página.
 *     responses:
 *       200:
 *         description: Lista de libros encontrados exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Libro'
 *       400:
 *         description: Error en la solicitud o en la base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   description: Detalles del error capturado.
 *       404:
 *         description: No se encontraron libros que coincidan con el término de búsqueda.
 */
router.get('/search', OptionalTokenValidation, controller.searchLibroByTitle);

/**
 * @openapi
 * /libros/{libroId}:
 *   get:
 *     summary: Obtener un libro por ID
 *     description: Recupera la información de un libro a partir de su identificador.
 *     tags:
 *       - Libros
 *     parameters:
 *       - in: path
 *         name: libroId
 *         required: true
 *         description: ID del libro en MongoDB
 *         schema:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *     responses:
 *       200:
 *         description: Libro obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Libro'
 *       404:
 *         description: Libro no encontrado
 */
router.get('/:libroId', controller.getLibro);

/**
 * @openapi
 * /libros:
 *   get:
 *     summary: Listar libros no eliminados
 *     description: Recupera la lista de libros que no han sido eliminados lógicamente.
 *     tags:
 *       - Libros
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Numero de pagina a consultar
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 2
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Cantidad maxima de elementos por pagina
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           example: 3
 *     responses:
 *       200:
 *         description: Lista paginada de libros obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Libro'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 2
 *                     limit:
 *                       type: integer
 *                       example: 3
 *                     totalPages:
 *                       type: integer
 *                       example: 9
 */
router.get('/', OptionalTokenValidation, controller.getAllLibros_NOT_Deleted);
router.get('/type/:type', OptionalTokenValidation, controller.getLibrosByType);

/**
 * @openapi
 * /libros/{libroId}:
 *   put:
 *     summary: Actualizar un libro por ID
 *     description: Actualiza los datos de un libro existente a partir de su identificador.
 *     tags:
 *       - Libros
 *     parameters:
 *       - in: path
 *         name: libroId
 *         required: true
 *         description: ID del libro en MongoDB
 *         schema:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *     requestBody:
 *       required: true
 *       description: Datos del libro a actualizar
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LibroCreateUpdate'
 *     responses:
 *       200:
 *         description: Libro actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Libro'
 *       404:
 *         description: Libro no encontrado
 */
router.put('/:libroId', ValidateJoi(Schemas.libro.update), controller.updateLibro);

/**
 * @openapi
 * /libros/{libroId}:
 *   delete:
 *     summary: Eliminar un libro por ID
 *     description: Elimina un libro existente a partir de su identificador.
 *     tags:
 *       - Libros
 *     parameters:
 *       - in: path
 *         name: libroId
 *         required: true
 *         description: ID del libro en MongoDB
 *         schema:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *     responses:
 *       200:
 *         description: Libro eliminado correctamente
 *       404:
 *         description: Libro no encontrado
 */
router.delete('/:libroId', controller.deleteLibro);

/**
 * @openapi
 * /libros/restore/{libroId}:
 *    put:
 *     summary: Recuperar un libro desactivado
 *     description: Cambia el estado IsDeleted a false para que el libro vuelva a estar operativo.
 *     tags: [Libros]
 *     parameters:
 *       - in: path
 *         name: libroId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId del libro a recuperar
 *     responses:
 *       200:
 *         description: Libro restaurado con éxito
 *       404:
 *         description: No se encontró el libro
 */
router.put('/restore/:libroId', controller.restoreLibro);

/**
 * @openapi
 * /libros/isbn/{isbn}/metadata:
 *   get:
 *     summary: Obtener metadata de un libro a partir de un ISBN
 *     description: Consulta OpenLibrary y devuelve datos basicos del libro sin crearlo en la base de datos. Esta ruta esta pensada para autocompletar formularios antes de guardar el libro.
 *     tags:
 *       - Libros
 *     parameters:
 *       - in: path
 *         name: isbn
 *         required: true
 *         description: ISBN del libro. Puede enviarse con o sin guiones.
 *         schema:
 *           type: string
 *           example: "9780140328721"
 *     responses:
 *       200:
 *         description: Metadata obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Metadata del libro obtenida con exito
 *                 data:
 *                   type: object
 *                   properties:
 *                     isbn:
 *                       type: string
 *                       example: "9780140328721"
 *                     title:
 *                       type: string
 *                       example: Matilda
 *                     authors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Roald Dahl"]
 *                     imageUrl:
 *                       type: string
 *                       example: "https://covers.openlibrary.org/b/isbn/9780140328721-L.jpg"
 *       404:
 *         description: No se encontro metadata para el ISBN indicado.
 *       500:
 *         description: Error al consultar OpenLibrary.
 */
router.get('/isbn/:isbn/metadata', controller.getLibroMetadataByIsbn);

/**
 * @openapi
 * /libros/isbn/{isbn}:
 *   get:
 *     summary: Crea un libro a partir de un ISBN
 *     tags:
 *       - Libros
 *     parameters:
 *       - in: path
 *         name: isbn
 *         required: true
 *         description: El ISBN
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         descripion: El lirbo ya existia
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Libro'
 *       201:
 *         descripion: Libro agregado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Libro'
 *       500:
 *         description: Server's controller error.
 *       404:
 *         description: The product with that id was not find.
 */
router.get('/isbn/:isbn', controller.createLibroByIsbn);
router.post('/buy/:libroId', TokenValidation, controller.buyLibro);
router.post('/rent/:libroId', TokenValidation, controller.rentLibro);

export default router;
