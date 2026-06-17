import express from 'express';
import controller from '../controllers/Evento';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { TokenValidation } from '../middleware/verifyToken';
const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Eventos
 *     description: Endpoints CRUD de eventos
 *
 * components:
 *   schemas:
 *     Point:
 *       type: object
 *       required:
 *         - type
 *         - coordinates
 *       properties:
 *         type:
 *           type: string
 *           enum: [Point]
 *           example: "Point"
 *         coordinates:
 *           type: array
 *           minItems: 2
 *           maxItems: 2
 *           items:
 *             type: number
 *           example: [2.15525, 41.38048]
 *           description: "[Longitud, Latitud] según el estándar GeoJSON de MongoDB"
 *
 *     Evento:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ObjectId de MongoDB
 *         title:
 *           type: string
 *           example: "Lectura de Clean Code"
 *         description:
 *           type: string
 *           example: "Sesión de lectura y debate del libro"
 *         date:
 *           type: string
 *           format: date-time
 *           example: "2026-03-12T10:00:00.000Z"
 *         location:
 *           $ref: '#/components/schemas/Point'
 *         direccionExacta:
 *           type: string
 *           example: "Calle Gran Vía 45, Barcelona"
 *         IsDeleted:
 *           type: boolean
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     EventoCreateUpdate:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - date
 *         - location
 *         - direccionExacta
 *       properties:
 *         title:
 *           type: string
 *           example: "Lectura de Clean Code"
 *         description:
 *           type: string
 *           example: "Sesión de lectura y debate del libro"
 *         date:
 *           type: string
 *           format: date-time
 *           example: "2026-03-12T10:00:00.000Z"
 *         location:
 *           $ref: '#/components/schemas/Point'
 *         direccionExacta:
 *           type: string
 *           example: "Calle Gran Vía 45, Barcelona"
 */

/**
 * @openapi
 * /eventos:
 *   get:
 *     summary: Lista todos los eventos
 *     tags: [Eventos]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Numero de pagina a consultar
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 2
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Cantidad maxima de elementos por pagina
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           example: 3
 *       - in: query
 *         name: timeFilter
 *         required: false
 *         description: Filtrar eventos por tiempo (upcoming o expired)
 *         schema:
 *           type: string
 *           enum: [upcoming, expired]
 *           default: upcoming
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Evento'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 2
 *                     limit:
 *                       type: integer
 *                       example: 3
 *                     totalPages:
 *                       type: integer
 *                       example: 9
 *
 *   post:
 *     summary: Crea un evento
 *     tags: [Eventos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventoCreateUpdate'
 *     responses:
 *       201:
 *         description: Creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evento'
 *       422:
 *         description: Validación fallida
 */
router.get('/', controller.getAllEventos);

router.post('/', ValidateJoi(Schemas.evento.create), controller.createEvento);

/**
 * @openapi
 * /eventos/exact-location:
 *   get:
 *     summary: Obtiene eventos en una coordenada exacta
 *     tags: [Eventos]
 *     parameters:
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Lista de eventos en la coordenada exacta
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Evento'
 *       400:
 *         description: Coordenadas faltantes o inválidas
 */
router.get('/exact-location', controller.getEventosByExactLocation);

/**
 * @openapi
 * /eventos/{eventoId}:
 *   get:
 *     summary: Obtiene un evento por ID
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evento'
 *       404:
 *         description: No encontrado
 *
 *   put:
 *     summary: Actualiza un evento por ID
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventoCreateUpdate'
 *     responses:
 *       201:
 *         description: Actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evento'
 *       404:
 *         description: No encontrado
 *
 *   delete:
 *     summary: Elimina un evento por ID
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Eliminado
 *       404:
 *         description: No encontrado
 */
router.get('/:eventoId', controller.getEvento);

router.put('/:eventoId', ValidateJoi(Schemas.evento.update), controller.updateEvento);

router.delete('/:eventoId', controller.deleteEvento);

/**
 * @openapi
 * /eventos/{eventoId}/restore:
 *   post:
 *     summary: Restaura un evento eliminado por ID (soft delete)
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurado
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/:eventoId/restore', controller.restoreEvento);

/**
 * @openapi
 * /eventos/{eventoId}/participate:
 *   put:
 *     summary: Registra la participación de un usuario en el evento
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuarioId
 *             properties:
 *               usuarioId:
 *                 type: string
 *                 example: "60c72b2f9b1d8b2bad00001a"
 *     responses:
 *       200:
 *         description: Participación registrada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evento'
 *       404:
 *         description: Evento no encontrado
 *       422:
 *         description: Validación fallida (ID inválido)
 */
router.put('/:eventoId/participate', TokenValidation, controller.participarEvento);
/**
 * @openapi
 * /eventos/{eventoId}/leave:
 *   put:
 *     summary: Cancela la participación de un usuario en el evento
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuarioId
 *             properties:
 *               usuarioId:
 *                 type: string
 *                 example: "60c72b2f9b1d8b2bad00001a"
 *     responses:
 *       200:
 *         description: Participación cancelada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evento'
 *       404:
 *         description: Evento no encontrado
 */
router.put('/:eventoId/leave', TokenValidation, controller.leaveEvento);
export default router;
