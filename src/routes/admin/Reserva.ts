import express from 'express';
import controller from '../../controllers/Reserva';
import { isAdmin } from '../../middleware/AuthRole';
import { Schemas, ValidateJoi } from '../../middleware/Joi';
import { TokenValidation } from '../../middleware/verifyToken';

const router = express.Router();
router.use(TokenValidation, isAdmin);

/**
 * @openapi
 * tags:
 *   - name: Admin - Reservas
 *     description: Gestión administrativa de reservas.
 * components:
 *   schemas:
 *     AdminReserva:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         libro:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Libro'
 *         usuarioSolicitante:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Usuario'
 *         propietario:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Usuario'
 *         estado:
 *           type: string
 *           enum: [PENDIENTE, ACEPTADA, RECHAZADA]
 *         fechaSolicitud: { type: string, format: date-time }
 *         fechaLimite: { type: string, format: date-time, nullable: true }
 *         IsDeleted: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     AdminReservaWrite:
 *       type: object
 *       properties:
 *         libro: { type: string }
 *         usuarioSolicitante: { type: string }
 *         propietario: { type: string }
 *         estado:
 *           type: string
 *           enum: [PENDIENTE, ACEPTADA, RECHAZADA]
 *         fechaSolicitud: { type: string, format: date-time }
 *         fechaLimite: { type: string, format: date-time, nullable: true }
 *         IsDeleted: { type: boolean }
 *     AdminReservaCreate:
 *       allOf:
 *         - $ref: '#/components/schemas/AdminReservaWrite'
 *       required: [libro, usuarioSolicitante, propietario, estado]
 *     AdminReservaStatus:
 *       type: object
 *       required: [IsDeleted]
 *       properties:
 *         IsDeleted: { type: boolean }
 *     AdminReservaResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean }
 *         status: { type: integer }
 *         message: { type: string }
 *         data:
 *           $ref: '#/components/schemas/AdminReserva'
 *     AdminReservasPage:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdminReserva'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     AdminReservasPageResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean }
 *         status: { type: integer }
 *         message: { type: string }
 *         data:
 *           $ref: '#/components/schemas/AdminReservasPage'
 */

/**
 * @openapi
 * /admin/reservas:
 *   get:
 *     summary: Lista reservas para administración
 *     tags: [Admin - Reservas]
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
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, ACEPTADA, RECHAZADA]
 *     responses:
 *       200:
 *         description: Página de reservas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminReservasPageResponse'
 *   post:
 *     summary: Crea una reserva administrativa
 *     tags: [Admin - Reservas]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminReservaCreate'
 *     responses:
 *       201:
 *         description: Reserva creada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminReservaResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 */
router.get('/', controller.getAdminReservas);
router.post('/', ValidateJoi(Schemas.reserva.adminCreate), controller.createAdminReserva);

/**
 * @openapi
 * /admin/reservas/{id}/status:
 *   patch:
 *     summary: Activa o desactiva una reserva
 *     tags: [Admin - Reservas]
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
 *             $ref: '#/components/schemas/AdminReservaStatus'
 *     responses:
 *       200:
 *         description: Estado actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminReservaResponse'
 */
router.patch('/:id/status', ValidateJoi(Schemas.reserva.status), controller.setAdminReservaStatus);

/**
 * @openapi
 * /admin/reservas/{id}:
 *   get:
 *     summary: Obtiene una reserva
 *     tags: [Admin - Reservas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Reserva obtenida.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminReservaResponse'
 *   put:
 *     summary: Actualiza una reserva
 *     tags: [Admin - Reservas]
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
 *             $ref: '#/components/schemas/AdminReservaWrite'
 *     responses:
 *       200:
 *         description: Reserva actualizada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminReservaResponse'
 *   delete:
 *     summary: Desactiva una reserva
 *     tags: [Admin - Reservas]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Reserva desactivada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminReservaResponse'
 */
router.get('/:id', controller.getAdminReserva);
router.put('/:id', ValidateJoi(Schemas.reserva.adminUpdate), controller.updateAdminReserva);
router.delete('/:id', controller.deactivateAdminReserva);

export default router;
