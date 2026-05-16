import express from 'express';
import controller from '../controllers/Libreria';
import { Schemas, ValidateJoi } from '../middleware/Joi';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Librerias
 *     description: Endpoints para gestionar librerías
 *
 * components:
 *   schemas:
 *     Libreria:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ObjectId de MongoDB
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *         name:
 *           type: string
 *           example: "Biblioteca Central"
 *         address:
 *           type: string
 *           example: "Calle Principal 123"
 *     LibreriaCreateUpdate:
 *       type: object
 *       required:
 *         - name
 *         - address
 *       properties:
 *         name:
 *           type: string
 *           example: "Biblioteca Central"
 *         address:
 *           type: string
 *           example: "Calle Principal 123"
 */

/**
 * @openapi
 * /librerias:
 *   post:
 *     summary: Crea una librería
 *     tags: [Librerias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LibreriaCreateUpdate'
 *     responses:
 *       201:
 *         description: Creado
 *       422:
 *         description: Validación fallida
 */
router.post('/', ValidateJoi(Schemas.libreria.create), controller.createLibreria);

/**
 * @openapi
 * /librerias/{libreriaId}:
 *   get:
 *     summary: Obtiene una librería por ID
 *     tags: [Librerias]
 *     parameters:
 *       - in: path
 *         name: libreriaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la librería
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: No encontrado
 */
router.get('/:libreriaId', controller.getLibreria);

/**
 * @openapi
 * /librerias:
 *   get:
 *     summary: Lista todas las librerías
 *     tags: [Librerias]
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
 *                     $ref: '#/components/schemas/Libreria'
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
 */
router.get('/', controller.getAllLibrerias);

/**
 * @openapi
 * /librerias/{libreriaId}:
 *   put:
 *     summary: Actualiza una librería por ID
 *     tags: [Librerias]
 *     parameters:
 *       - in: path
 *         name: libreriaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la librería
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LibreriaCreateUpdate'
 *     responses:
 *       201:
 *         description: Actualizado
 *       404:
 *         description: No encontrado
 *       422:
 *         description: Validación fallida
 */
router.put('/:libreriaId', ValidateJoi(Schemas.libreria.update), controller.updateLibreria);

/**
 * @openapi
 * /librerias/{libreriaId}:
 *   delete:
 *     summary: Elimina una librería por ID
 *     tags: [Librerias]
 *     parameters:
 *       - in: path
 *         name: libreriaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la librería
 *     responses:
 *       201:
 *         description: OK
 *       404:
 *         description: No encontrado
 */
router.delete('/:libreriaId', controller.deleteLibreria);

/**
 * @openapi
 * /librerias/{libreriaId}/restaurar:
 *   post:
 *     summary: Restaura una librería eliminada por ID
 *     tags: [Librerias]
 *     parameters:
 *       - in: path
 *         name: libreriaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la librería
 *     responses:
 *       201:
 *         description: OK
 *       404:
 *         description: No encontrado
 *       422:
 *         description: Validación fallida
 * */
router.post('/:libreriaId/restaurar', controller.restoreLibreria);

export default router;
