import express from 'express';
import controller from '../../controllers/Retos';
import { isAdmin } from '../../middleware/AuthRole';
import { Schemas, ValidateJoi } from '../../middleware/Joi';
import { TokenValidation } from '../../middleware/verifyToken';

const router = express.Router();
router.use(TokenValidation, isAdmin);

/**
 * @openapi
 * tags:
 *   - name: Admin - Retos
 *     description: Gestión administrativa del catálogo de retos.
 * components:
 *   schemas:
 *     AdminReto:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         title: { type: string }
 *         description: { type: string }
 *         type:
 *           type: string
 *           enum: [COMPRAR_LIBROS, ALQUILAR_LIBROS, SEGUIR_USUARIOS, RECIBIR_VALORACIONES, ASISTIR_EVENTOS, SUBIR_LIBROS]
 *         objetivo: { type: integer, minimum: 1 }
 *         activo: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     AdminRetoWrite:
 *       type: object
 *       properties:
 *         title: { type: string }
 *         description: { type: string }
 *         type:
 *           type: string
 *           enum: [COMPRAR_LIBROS, ALQUILAR_LIBROS, SEGUIR_USUARIOS, RECIBIR_VALORACIONES, ASISTIR_EVENTOS, SUBIR_LIBROS]
 *         objetivo: { type: integer, minimum: 1 }
 *         activo: { type: boolean }
 *     AdminRetoCreate:
 *       allOf:
 *         - $ref: '#/components/schemas/AdminRetoWrite'
 *       required: [title, description, type, objetivo]
 *     AdminRetoStatus:
 *       type: object
 *       required: [activo]
 *       properties:
 *         activo: { type: boolean }
 *     AdminRetoResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean }
 *         status: { type: integer }
 *         message: { type: string }
 *         data:
 *           $ref: '#/components/schemas/AdminReto'
 *     AdminRetosPage:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdminReto'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     AdminRetosPageResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean }
 *         status: { type: integer }
 *         message: { type: string }
 *         data:
 *           $ref: '#/components/schemas/AdminRetosPage'
 */

/**
 * @openapi
 * /admin/retos:
 *   get:
 *     summary: Lista retos para administración
 *     tags: [Admin - Retos]
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
 *         name: searchField
 *         schema:
 *           type: string
 *           enum: [title, type, objective, date, _id]
 *         description: Campo seguro por el que se realiza la búsqueda.
 *       - in: query
 *         name: includeInactive
 *         schema: { type: boolean, default: true }
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [COMPRAR_LIBROS, ALQUILAR_LIBROS, SEGUIR_USUARIOS, RECIBIR_VALORACIONES, ASISTIR_EVENTOS, SUBIR_LIBROS]
 *     responses:
 *       200:
 *         description: Página de retos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminRetosPageResponse'
 *   post:
 *     summary: Crea un reto administrativo
 *     tags: [Admin - Retos]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminRetoCreate'
 *     responses:
 *       201:
 *         description: Reto creado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminRetoResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 */
router.get('/', controller.getAdminRetos);
router.post('/', ValidateJoi(Schemas.reto.adminCreate), controller.createAdminReto);

/**
 * @openapi
 * /admin/retos/{id}/status:
 *   patch:
 *     summary: Activa o desactiva un reto
 *     tags: [Admin - Retos]
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
 *             $ref: '#/components/schemas/AdminRetoStatus'
 *     responses:
 *       200:
 *         description: Estado actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminRetoResponse'
 */
router.patch('/:id/status', ValidateJoi(Schemas.reto.status), controller.setAdminRetoStatus);

/**
 * @openapi
 * /admin/retos/{id}/permanent:
 *   delete:
 *     summary: Elimina definitivamente un reto y sus progresos
 *     tags: [Admin - Retos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Reto eliminado definitivamente.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id/permanent', controller.permanentDeleteAdminReto);

/**
 * @openapi
 * /admin/retos/{id}:
 *   get:
 *     summary: Obtiene un reto
 *     tags: [Admin - Retos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Reto obtenido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminRetoResponse'
 *   put:
 *     summary: Actualiza un reto
 *     tags: [Admin - Retos]
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
 *             $ref: '#/components/schemas/AdminRetoWrite'
 *     responses:
 *       200:
 *         description: Reto actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminRetoResponse'
 *   delete:
 *     summary: Desactiva un reto
 *     tags: [Admin - Retos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Reto desactivado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminRetoResponse'
 */
router.get('/:id', controller.getAdminReto);
router.put('/:id', ValidateJoi(Schemas.reto.adminUpdate), controller.updateAdminReto);
router.delete('/:id', controller.deactivateAdminReto);

export default router;
