import express from 'express';
import controller from '../../controllers/Post';
import { isAdmin } from '../../middleware/AuthRole';
import { Schemas, ValidateJoi } from '../../middleware/Joi';
import { TokenValidation } from '../../middleware/verifyToken';

const router = express.Router();
router.use(TokenValidation, isAdmin);

/**
 * @openapi
 * tags:
 *   - name: Admin - Posts
 *     description: CRUD administrativo de posts para el BackOffice.
 * components:
 *   schemas:
 *     AdminPostWrite:
 *       type: object
 *       properties:
 *         description: { type: string }
 *         status:
 *           type: string
 *           enum: [VENTA, ALQUILER, NO_DISPONIBLE]
 *         imageUrl: { type: string, nullable: true }
 *         IsDeleted: { type: boolean }
 *         ownerId: { type: string }
 *         bookId: { type: string }
 *         price: { type: number, minimum: 0 }
 *     AdminPostCreate:
 *       allOf:
 *         - $ref: '#/components/schemas/AdminPostWrite'
 *       required: [description, status, ownerId, bookId, price]
 *     AdminPostDeletedStatus:
 *       type: object
 *       required: [IsDeleted]
 *       properties:
 *         IsDeleted: { type: boolean }
 *     AdminPostResponse:
 *       type: object
 *       required: [success, status, message, data]
 *       properties:
 *         success: { type: boolean }
 *         status: { type: integer }
 *         message: { type: string }
 *         data:
 *           $ref: '#/components/schemas/Post'
 *     AdminPostsPage:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Post'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     AdminPostsPageResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean }
 *         status: { type: integer }
 *         message: { type: string }
 *         data:
 *           $ref: '#/components/schemas/AdminPostsPage'
 */

/**
 * @openapi
 * /admin/posts:
 *   get:
 *     summary: Lista posts para el BackOffice
 *     tags: [Admin - Posts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: includeDeleted
 *         schema: { type: boolean, default: true }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [VENTA, ALQUILER, NO_DISPONIBLE]
 *     responses:
 *       200:
 *         description: Página de posts.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminPostsPageResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     summary: Crea un post administrativo
 *     tags: [Admin - Posts]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminPostCreate'
 *     responses:
 *       201:
 *         description: Post creado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminPostResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 */
router.get('/', controller.readAdminPosts);
router.post('/', ValidateJoi(Schemas.post.adminCreate), controller.createAdminPost);

/**
 * @openapi
 * /admin/posts/{id}/status:
 *   patch:
 *     summary: Activa o desactiva un post
 *     tags: [Admin - Posts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminPostDeletedStatus'
 *     responses:
 *       200:
 *         description: Estado actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminPostResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/status', ValidateJoi(Schemas.post.deletedStatus), controller.setAdminPostStatus);

/**
 * @openapi
 * /admin/posts/{id}:
 *   get:
 *     summary: Obtiene un post
 *     tags: [Admin - Posts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Post obtenido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminPostResponse'
 *   put:
 *     summary: Actualiza un post
 *     tags: [Admin - Posts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminPostWrite'
 *     responses:
 *       200:
 *         description: Post actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminPostResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 *   delete:
 *     summary: Desactiva un post
 *     tags: [Admin - Posts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Post desactivado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminPostResponse'
 */
router.get('/:id', controller.readAdminPost);
router.put('/:id', ValidateJoi(Schemas.post.adminUpdate), controller.updateAdminPost);
router.delete('/:id', controller.deactivateAdminPost);

export default router;
