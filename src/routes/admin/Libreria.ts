import express from 'express';
import controller from '../../controllers/Libreria';
import { isAdmin } from '../../middleware/AuthRole';
import { Schemas, ValidateJoi } from '../../middleware/Joi';
import { TokenValidation } from '../../middleware/verifyToken';

const router = express.Router();

router.use(TokenValidation, isAdmin);

/**
 * @openapi
 * tags:
 *   - name: Admin - Librerías
 *     description: CRUD administrativo de librerías para el BackOffice.
 * components:
 *   schemas:
 *     AdminLibreriaWrite:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         IsDeleted:
 *           type: boolean
 *     AdminLibreriaCreate:
 *       allOf:
 *         - $ref: '#/components/schemas/AdminLibreriaWrite'
 *       required: [name, address]
 *     AdminLibreriaStatus:
 *       type: object
 *       required: [IsDeleted]
 *       properties:
 *         IsDeleted:
 *           type: boolean
 *     AdminLibreriaResponse:
 *       type: object
 *       required: [success, status, message, data]
 *       properties:
 *         success: { type: boolean }
 *         status: { type: integer }
 *         message: { type: string }
 *         data:
 *           $ref: '#/components/schemas/Libreria'
 *     AdminLibreriasPage:
 *       type: object
 *       required: [data, pagination]
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Libreria'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     AdminLibreriasPageResponse:
 *       type: object
 *       required: [success, status, message, data]
 *       properties:
 *         success: { type: boolean }
 *         status: { type: integer }
 *         message: { type: string }
 *         data:
 *           $ref: '#/components/schemas/AdminLibreriasPage'
 */

/**
 * @openapi
 * /admin/librerias:
 *   get:
 *     summary: Lista librerías para el BackOffice
 *     tags: [Admin - Librerías]
 *     security:
 *       - bearerAuth: []
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
 *           enum: [name, address, _id]
 *           default: name
 *         description: Campo permitido sobre el que se aplica la búsqueda.
 *       - in: query
 *         name: includeDeleted
 *         schema: { type: boolean, default: true }
 *     responses:
 *       200:
 *         description: Página de librerías obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLibreriasPageResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     summary: Crea una librería
 *     tags: [Admin - Librerías]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLibreriaCreate'
 *     responses:
 *       201:
 *         description: Librería creada correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLibreriaResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 */
router.get('/', controller.getAdminLibrerias);
router.post('/', ValidateJoi(Schemas.libreria.create), controller.createAdminLibreria);

/**
 * @openapi
 * /admin/librerias/{libreriaId}/status:
 *   patch:
 *     summary: Activa o desactiva una librería
 *     tags: [Admin - Librerías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: libreriaId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLibreriaStatus'
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLibreriaResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 */
router.patch(
  '/:libreriaId/status',
  ValidateJoi(Schemas.libreria.status),
  controller.setAdminLibreriaStatus,
);

/**
 * @openapi
 * /admin/librerias/{libreriaId}/permanent:
 *   delete:
 *     summary: Elimina definitivamente una librería
 *     description: Elimina físicamente el documento. Esta acción no se puede deshacer.
 *     tags: [Admin - Librerías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: libreriaId
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Librería eliminada definitivamente.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:libreriaId/permanent', controller.permanentDeleteAdminLibreria);

/**
 * @openapi
 * /admin/librerias/{libreriaId}:
 *   get:
 *     summary: Obtiene una librería
 *     tags: [Admin - Librerías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: libreriaId
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Librería obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLibreriaResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Actualiza una librería
 *     tags: [Admin - Librerías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: libreriaId
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLibreriaWrite'
 *     responses:
 *       200:
 *         description: Librería actualizada correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLibreriaResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 *   delete:
 *     summary: Desactiva una librería
 *     tags: [Admin - Librerías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: libreriaId
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200:
 *         description: Librería desactivada correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLibreriaResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:libreriaId', controller.getAdminLibreria);
router.put('/:libreriaId', ValidateJoi(Schemas.libreria.update), controller.updateAdminLibreria);
router.delete('/:libreriaId', controller.deactivateAdminLibreria);

export default router;
