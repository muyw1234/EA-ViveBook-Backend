import express from 'express';
import controller from '../../controllers/Libro';
import { isAdmin } from '../../middleware/AuthRole';
import { Schemas, ValidateJoi } from '../../middleware/Joi';
import { TokenValidation } from '../../middleware/verifyToken';

const router = express.Router();

router.use(TokenValidation, isAdmin);

/**
 * @openapi
 * tags:
 *   - name: Admin - Libros
 *     description: CRUD administrativo de libros para el BackOffice.
 * components:
 *   schemas:
 *     AdminLibroWrite:
 *       type: object
 *       properties:
 *         isbn:
 *           type: string
 *           example: '9780132350884'
 *         title:
 *           type: string
 *           example: Clean Code
 *         autor:
 *           type: string
 *         categoria:
 *           type: string
 *         authors:
 *           type: array
 *           items:
 *             type: string
 *         type:
 *           type: string
 *           enum: [VENTA, ALQUILER]
 *         precio:
 *           type: number
 *           minimum: 0
 *         estado:
 *           type: string
 *         owner:
 *           type: string
 *           nullable: true
 *         IsDeleted:
 *           type: boolean
 *         rentalStartDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         rentalEndDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         imageUrl:
 *           type: string
 *           nullable: true
 *         isReserved:
 *           type: boolean
 *         reservedBy:
 *           type: string
 *           nullable: true
 *         reservationExpiry:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     AdminLibroCreate:
 *       allOf:
 *         - $ref: '#/components/schemas/AdminLibroWrite'
 *       required: [isbn, title, type, precio, estado]
 *     AdminLibroStatus:
 *       type: object
 *       required: [IsDeleted]
 *       properties:
 *         IsDeleted:
 *           type: boolean
 *           description: true desactiva el libro y false lo activa.
 *     AdminLibroResponse:
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
 *           example: Libro obtenido con éxito
 *         data:
 *           $ref: '#/components/schemas/Libro'
 *     AdminLibrosPage:
 *       type: object
 *       required: [data, pagination]
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Libro'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     AdminLibrosPageResponse:
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
 *           example: Listado administrativo de libros obtenido con éxito
 *         data:
 *           $ref: '#/components/schemas/AdminLibrosPage'
 */

/**
 * @openapi
 * /admin/libros:
 *   get:
 *     summary: Lista libros para el BackOffice
 *     tags: [Admin - Libros]
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
 *         description: Busca en título, ISBN, autor textual, categoría y estado.
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [VENTA, ALQUILER]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Página de libros obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLibrosPageResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   post:
 *     summary: Crea un libro sin asociarlo automáticamente al administrador
 *     tags: [Admin - Libros]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLibroCreate'
 *     responses:
 *       201:
 *         description: Libro creado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLibroResponse'
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
router.get('/', controller.getAdminLibros);
router.post('/', ValidateJoi(Schemas.libro.adminCreate), controller.createAdminLibro);

/**
 * @openapi
 * /admin/libros/{libroId}/status:
 *   patch:
 *     summary: Activa o desactiva un libro
 *     tags: [Admin - Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: libroId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLibroStatus'
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLibroResponse'
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
router.patch('/:libroId/status', ValidateJoi(Schemas.libro.status), controller.setLibroStatus);

/**
 * @openapi
 * /admin/libros/{libroId}:
 *   get:
 *     summary: Obtiene el detalle de un libro
 *     tags: [Admin - Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: libroId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Libro obtenido correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLibroResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   put:
 *     summary: Actualiza un libro
 *     tags: [Admin - Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: libroId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLibroWrite'
 *     responses:
 *       200:
 *         description: Libro actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLibroResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   delete:
 *     summary: Desactiva un libro
 *     description: Realiza un borrado lógico estableciendo IsDeleted en true.
 *     tags: [Admin - Libros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: libroId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Libro desactivado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLibroResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:libroId', controller.getLibro);
router.put('/:libroId', ValidateJoi(Schemas.libro.adminUpdate), controller.updateLibro);
router.delete('/:libroId', controller.deactivateLibro);

export default router;
