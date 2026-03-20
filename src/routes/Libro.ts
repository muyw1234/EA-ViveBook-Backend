import express from 'express';
import controller from '../controllers/Libro';
import { Schemas, ValidateJoi } from '../middleware/Joi';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Libros
 *     description: Endpoints CRUD de libros
 * components:
 *   schemas:
 *     Libro:
 *       type: object
 *       description: Representa un libro en la base de datos
 *       properties:
 *         _id:
 *           type: string
 *           description: ObjectId de MongoDB
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *         isbn:
 *           type: string
 *           description: ISBN del libro
 *           example: "978-0132350884"
 *         title:
 *           type: string
 *           description: Título del libro
 *           example: "Clean Code"
 *         authors:
 *           type: array
 *           description: Lista de IDs de autores asociados al libro
 *           items:
 *             type: string
 *             example: "65f1c2a1b2c3d4e5f6789013"
 *           example:
 *             - "65f1c2a1b2c3d4e5f6789013"
 *         IsDeleted:
 *           type: boolean
 *           description: Indica si el libro ha sido eliminado lógicamente
 *           example: false
 *     LibroCreateUpdate:
 *       type: object
 *       description: Datos necesarios para crear o actualizar un libro
 *       required:
 *         - title
 *         - authors
 *       properties:
 *         title:
 *           type: string
 *           description: Título del libro
 *           example: "Clean Code"
 *         authors:
 *           type: array
 *           description: Lista de IDs de autores asociados al libro
 *           items:
 *             type: string
 *             example: "65f1c2a1b2c3d4e5f6789013"
 *             pattern: '^[0-9a-fA-F]{24}$'
 *           example:
 *             - "65f1c2a1b2c3d4e5f6789013"
 *         isbn:
 *           type: string
 *           description: ISBN del libro
 *           example: "978-0132350884"
 *         IsDeleted:
 *           type: boolean
 *           description: Indica si el libro ha sido eliminado lógicamente
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
router.post('/', ValidateJoi(Schemas.libro.create), controller.createLibro);

/**
 * @openapi
 * /libros/all:
 *   get:
 *     summary: Listar todos los libros
 *     description: Recupera la lista completa de libros registrados.
 *     tags:
 *       - Libros
 *     responses:
 *       200:
 *         description: Lista de libros obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Libro'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/all', controller.getAllLibros);

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
 *     responses:
 *       200:
 *         description: Lista de libros obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Libro'
 */
router.get('/', controller.getAllLibros_NOT_Deleted);

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

export default router;
