import express from 'express';
import controller from '../../controllers/Evento';
import { isAdmin } from '../../middleware/AuthRole';
import { Schemas, ValidateJoi } from '../../middleware/Joi';
import { TokenValidation } from '../../middleware/verifyToken';

const router = express.Router();
router.use(TokenValidation, isAdmin);

/**
 * @openapi
 * tags:
 *   - name: Admin - Eventos
 *     description: CRUD administrativo de eventos para el BackOffice.
 * components:
 *   schemas:
 *     AdminEventoWrite:
 *       type: object
 *       properties:
 *         title: { type: string }
 *         description: { type: string }
 *         creator: { type: string }
 *         participant:
 *           type: array
 *           items: { type: string }
 *         eventDate: { type: string, format: date-time }
 *         createdDate: { type: string, format: date-time }
 *         location:
 *           $ref: '#/components/schemas/Point'
 *         direccionExacta: { type: string }
 *         IsDeleted: { type: boolean }
 *     AdminEventoCreate:
 *       allOf:
 *         - $ref: '#/components/schemas/AdminEventoWrite'
 *       required: [title, description, creator, eventDate, location, direccionExacta]
 *     AdminEventoStatus:
 *       type: object
 *       required: [IsDeleted]
 *       properties:
 *         IsDeleted: { type: boolean }
 *     AdminEventoResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean }
 *         status: { type: integer }
 *         message: { type: string }
 *         data:
 *           $ref: '#/components/schemas/Evento'
 *     AdminEventosPage:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Evento'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     AdminEventosPageResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean }
 *         status: { type: integer }
 *         message: { type: string }
 *         data:
 *           $ref: '#/components/schemas/AdminEventosPage'
 */

/**
 * @openapi
 * /admin/eventos:
 *   get:
 *     summary: Lista eventos para el BackOffice
 *     tags: [Admin - Eventos]
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
 *         description: Texto que se buscará en el campo seleccionado.
 *       - in: query
 *         name: searchField
 *         schema:
 *           type: string
 *           enum: [title, eventDate, address, _id]
 *           default: title
 *         description: Campo permitido. eventDate acepta el formato AAAA-MM-DD.
 *       - in: query
 *         name: includeDeleted
 *         schema: { type: boolean, default: true }
 *       - in: query
 *         name: upcoming
 *         schema: { type: boolean }
 *         description: true filtra próximos y false filtra pasados.
 *     responses:
 *       200:
 *         description: Página de eventos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminEventosPageResponse'
 *   post:
 *     summary: Crea un evento administrativo
 *     tags: [Admin - Eventos]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminEventoCreate'
 *     responses:
 *       201:
 *         description: Evento creado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminEventoResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 */
router.get('/', controller.getAdminEventos);
router.post('/', ValidateJoi(Schemas.evento.adminCreate), controller.createAdminEvento);

/**
 * @openapi
 * /admin/eventos/{eventoId}/status:
 *   patch:
 *     summary: Activa o desactiva un evento
 *     tags: [Admin - Eventos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminEventoStatus'
 *     responses:
 *       200:
 *         description: Estado actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminEventoResponse'
 */
router.patch(
  '/:eventoId/status',
  ValidateJoi(Schemas.evento.status),
  controller.setAdminEventoStatus,
);

/**
 * @openapi
 * /admin/eventos/{eventoId}/permanent:
 *   delete:
 *     summary: Elimina definitivamente un evento
 *     description: Elimina físicamente el documento. Esta acción no se puede deshacer.
 *     tags: [Admin - Eventos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Evento eliminado definitivamente.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:eventoId/permanent', controller.permanentDeleteAdminEvento);

/**
 * @openapi
 * /admin/eventos/{eventoId}:
 *   get:
 *     summary: Obtiene un evento
 *     tags: [Admin - Eventos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Evento obtenido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminEventoResponse'
 *   put:
 *     summary: Actualiza un evento
 *     tags: [Admin - Eventos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminEventoWrite'
 *     responses:
 *       200:
 *         description: Evento actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminEventoResponse'
 *   delete:
 *     summary: Desactiva un evento
 *     tags: [Admin - Eventos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Evento desactivado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminEventoResponse'
 */
router.get('/:eventoId', controller.getAdminEvento);
router.put('/:eventoId', ValidateJoi(Schemas.evento.adminUpdate), controller.updateAdminEvento);
router.delete('/:eventoId', controller.deactivateAdminEvento);

export default router;
