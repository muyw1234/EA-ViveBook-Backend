import express from 'express';
import controller from '../../controllers/Autor';
import { isAdmin } from '../../middleware/AuthRole';
import { Schemas, ValidateJoi } from '../../middleware/Joi';
import { TokenValidation } from '../../middleware/verifyToken';

const router = express.Router();

router.use(TokenValidation, isAdmin);

/**
 * @openapi
 * tags:
 *   - name: Admin - Autores
 *     description: CRUD administrativo de autores para el BackOffice.
 * components:
 *   schemas:
 *     AdminAutorResponse:
 *       type: object
 *       required: [success, status, message, data]
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         status:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: Autor obtenido con éxito
 *         data:
 *           $ref: '#/components/schemas/Autor'
 *     AdminAutoresPage:
 *       type: object
 *       required: [data, pagination]
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Autor'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     AdminAutoresPageResponse:
 *       type: object
 *       required: [success, status, message, data]
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         status:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: Listado administrativo de autores obtenido con éxito
 *         data:
 *           $ref: '#/components/schemas/AdminAutoresPage'
 *     AdminAutorStatus:
 *       type: object
 *       required: [IsDeleted]
 *       properties:
 *         IsDeleted:
 *           type: boolean
 *           description: true desactiva el autor y false lo activa.
 */

/**
 * @openapi
 * /admin/autores:
 *   get:
 *     summary: Lista autores para el BackOffice
 *     description: Devuelve autores paginados, permite búsqueda remota e incluye opcionalmente autores desactivados.
 *     tags: [Admin - Autores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Texto que se buscará en el campo seleccionado.
 *       - in: query
 *         name: searchField
 *         schema:
 *           type: string
 *           enum: [fullName, _id]
 *           default: fullName
 *         description: Campo permitido sobre el que se aplica la búsqueda.
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Página de autores obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminAutoresPageResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   post:
 *     summary: Crea un autor
 *     tags: [Admin - Autores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AutorCreateUpdate'
 *     responses:
 *       201:
 *         description: Autor creado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminAutorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', controller.getAdminAutores);
router.post('/', ValidateJoi(Schemas.Autor.create), controller.createAutor);

/**
 * @openapi
 * /admin/autores/{autorId}/status:
 *   patch:
 *     summary: Activa o desactiva un autor
 *     tags: [Admin - Autores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: autorId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminAutorStatus'
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminAutorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/:autorId/status', ValidateJoi(Schemas.Autor.status), controller.setAutorStatus);

/**
 * @openapi
 * /admin/autores/{autorId}/permanent:
 *   delete:
 *     summary: Elimina definitivamente un autor
 *     description: Elimina físicamente el documento. Esta acción no se puede deshacer.
 *     tags: [Admin - Autores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: autorId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Autor eliminado definitivamente.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:autorId/permanent', controller.deleteAutor);

/**
 * @openapi
 * /admin/autores/{autorId}:
 *   get:
 *     summary: Obtiene el detalle de un autor
 *     tags: [Admin - Autores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: autorId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Autor obtenido correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminAutorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   put:
 *     summary: Actualiza un autor
 *     tags: [Admin - Autores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: autorId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AutorCreateUpdate'
 *     responses:
 *       200:
 *         description: Autor actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminAutorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   delete:
 *     summary: Desactiva un autor
 *     description: Realiza un borrado lógico estableciendo IsDeleted en true.
 *     tags: [Admin - Autores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: autorId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Autor desactivado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminAutorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:autorId', controller.getAutor);
router.put('/:autorId', ValidateJoi(Schemas.Autor.update), controller.updateAutor);
router.delete('/:autorId', controller.deactivateAutor);

export default router;
