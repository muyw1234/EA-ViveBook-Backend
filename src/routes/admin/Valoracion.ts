import express from 'express';
import controller from '../../controllers/Valoracion';
import { isAdmin } from '../../middleware/AuthRole';
import { Schemas, ValidateJoi } from '../../middleware/Joi';
import { TokenValidation } from '../../middleware/verifyToken';

const router = express.Router();
router.use(TokenValidation, isAdmin);

/**
 * @openapi
 * tags:
 *   - name: Admin - Valoraciones
 *     description: Moderación y CRUD administrativo de valoraciones.
 * components:
 *   schemas:
 *     AdminValoracion:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         usuarioAutor:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Usuario'
 *         usuarioValorado:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Usuario'
 *         libro:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Libro'
 *         tipoOperacion:
 *           type: string
 *           enum: [VENTA, ALQUILER, RESERVA]
 *         puntuacion: { type: integer, minimum: 1, maximum: 5 }
 *         comentario: { type: string }
 *         reservationId: { type: string, nullable: true }
 *         IsDeleted: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     AdminValoracionWrite:
 *       type: object
 *       properties:
 *         usuarioAutor: { type: string }
 *         usuarioValorado: { type: string }
 *         libro: { type: string }
 *         tipoOperacion:
 *           type: string
 *           enum: [VENTA, ALQUILER, RESERVA]
 *         puntuacion: { type: integer, minimum: 1, maximum: 5 }
 *         comentario: { type: string }
 *         reservationId: { type: string, nullable: true }
 *         IsDeleted: { type: boolean }
 *     AdminValoracionCreate:
 *       allOf:
 *         - $ref: '#/components/schemas/AdminValoracionWrite'
 *       required: [usuarioAutor, usuarioValorado, libro, tipoOperacion, puntuacion]
 *     AdminValoracionStatus:
 *       type: object
 *       required: [IsDeleted]
 *       properties:
 *         IsDeleted: { type: boolean }
 *     AdminValoracionResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean }
 *         status: { type: integer }
 *         message: { type: string }
 *         data:
 *           $ref: '#/components/schemas/AdminValoracion'
 *     AdminValoracionesPage:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdminValoracion'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     AdminValoracionesPageResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean }
 *         status: { type: integer }
 *         message: { type: string }
 *         data:
 *           $ref: '#/components/schemas/AdminValoracionesPage'
 */

/**
 * @openapi
 * /admin/valoraciones:
 *   get:
 *     summary: Lista valoraciones para moderación
 *     tags: [Admin - Valoraciones]
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
 *         name: puntuacion
 *         schema: { type: integer, minimum: 1, maximum: 5 }
 *       - in: query
 *         name: tipoOperacion
 *         schema:
 *           type: string
 *           enum: [VENTA, ALQUILER, RESERVA]
 *     responses:
 *       200:
 *         description: Página de valoraciones.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminValoracionesPageResponse'
 *   post:
 *     summary: Crea una valoración administrativa
 *     tags: [Admin - Valoraciones]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminValoracionCreate'
 *     responses:
 *       201:
 *         description: Valoración creada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminValoracionResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 */
router.get('/', controller.getAdminValoraciones);
router.post('/', ValidateJoi(Schemas.valoracion.adminCreate), controller.createAdminValoracion);

/**
 * @openapi
 * /admin/valoraciones/{id}/status:
 *   patch:
 *     summary: Activa o desactiva una valoración
 *     tags: [Admin - Valoraciones]
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
 *             $ref: '#/components/schemas/AdminValoracionStatus'
 *     responses:
 *       200:
 *         description: Estado actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminValoracionResponse'
 */
router.patch(
  '/:id/status',
  ValidateJoi(Schemas.valoracion.status),
  controller.setAdminValoracionStatus,
);

/**
 * @openapi
 * /admin/valoraciones/{id}:
 *   get:
 *     summary: Obtiene una valoración
 *     tags: [Admin - Valoraciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Valoración obtenida.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminValoracionResponse'
 *   put:
 *     summary: Actualiza una valoración
 *     tags: [Admin - Valoraciones]
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
 *             $ref: '#/components/schemas/AdminValoracionWrite'
 *     responses:
 *       200:
 *         description: Valoración actualizada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminValoracionResponse'
 *   delete:
 *     summary: Desactiva una valoración
 *     tags: [Admin - Valoraciones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Valoración desactivada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminValoracionResponse'
 */
router.get('/:id', controller.getAdminValoracion);
router.put('/:id', ValidateJoi(Schemas.valoracion.adminUpdate), controller.updateAdminValoracion);
router.delete('/:id', controller.deactivateAdminValoracion);

export default router;
