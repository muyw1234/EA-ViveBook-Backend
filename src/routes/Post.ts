import express, { Router } from 'express';
import controller from '../controllers/Post';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { Schema } from 'mongoose';
const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Post
 *     description: Endpoints de gestión de posts
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Post's id
 *           example: 17y2187y23hu
 *         description:
 *           type: string
 *           description: Post's description
 *         status:
 *           type: string
 *           description: Post status (VENTA, ALQUILER, NO_DISPONIBLE)
 *           example: VENTA
 *         imageUrl:
 *           type: string
 *           description: Optional picture url of the post
 *           example: https://example.com/image.jpg
 *         IsDeleted:
 *           type: boolean
 *           description: Indicates if it is soft deleted
 *           example: false
 *         ownerId:
 *           type: string
 *           description: Post's user
 *           example: 65f1c2a1b2c3d4e5f6789012
 *         bookId:
 *           type: string
 *           description: Associated book id
 *           example: 65f1c2a1b2c3d4e5f6789013
 *     CreateUpdatePost:
 *       type: object
 *       required:
 *         - description
 *         - status
 *         - ownerId
 *         - bookId
 *       properties:
 *         description:
 *           type: string
 *           description: Post's description
 *         status:
 *           type: string
 *           description: Post status (VENTA, ALQUILER, NO_DISPONIBLE)
 *         imageUrl:
 *           type: string
 *           description: Optional picture url of the post
 *         IsDeleted:
 *           type: boolean
 *           description: Indicates if it is soft deleted
 *         ownerId:
 *           type: string
 *           description: Post's user
 *         bookId:
 *           type: string
 *           description: Associated book id
 */

/**
 * @openapi
 * /posts:
 *   post:
 *     summary: Crear un nuevo post
 *     tags:
 *       - Post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUpdatePost'
 *     responses:
 *       201:
 *         description: Post creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Datos inválidos
 */
router.post('/', ValidateJoi(Schemas.post.create), controller.createPost);

/**
 * @openapi
 * /posts/{isbn}:
 *   post:
 *     summary: Crear un post a partir de ISBN
 *     tags:
 *       - Post
 *     parameters:
 *       - in: path
 *         name: isbn
 *         required: true
 *         schema:
 *           type: string
 *         description: ISBN del libro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUpdatePost'
 *     responses:
 *       201:
 *         description: Post creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 */
router.post('/:isbn', ValidateJoi(Schemas.post.update), controller.createPostByIsbn);

/**
 * @openapi
 * /posts/{id}:
 *   get:
 *     summary: Obtener un post por ID
 *     tags:
 *       - Post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del post
 *     responses:
 *       200:
 *         description: Post encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post no encontrado
 */
router.get('/:id', controller.readPost);

/**
 * @openapi
 * /posts:
 *   get:
 *     summary: Obtener todos los posts
 *     tags:
 *       - Post
 *     responses:
 *       200:
 *         description: Lista de posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
router.get('/', controller.readAllPost);

/**
 * @openapi
 * /posts/{id}:
 *   put:
 *     summary: Actualizar un post
 *     tags:
 *       - Post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUpdatePost'
 *     responses:
 *       200:
 *         description: Post actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post no encontrado
 */
router.put('/:id', ValidateJoi(Schemas.post.update), controller.updatePost);

/**
 * @openapi
 * /posts/{id}:
 *   delete:
 *     summary: Eliminar un post (hard delete)
 *     tags:
 *       - Post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del post
 *     responses:
 *       200:
 *         description: Post eliminado correctamente
 *       404:
 *         description: Post no encontrado
 */
router.delete('/:id', controller.deletePost);

export default router;
