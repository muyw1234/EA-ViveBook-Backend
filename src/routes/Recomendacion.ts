import express from 'express';
import controller from '../controllers/Recomendacion';
import { Schemas, ValidateJoi } from '../middleware/Joi';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Recomendaciones
 *     description: Endpoints de recomendaciones con IA
 *
 * components:
 *   schemas:
 *     RecomendacionRequest:
 *       type: object
 *       required:
 *         - query
 *       properties:
 *         query:
 *           type: string
 *           description: Necesidad o preferencia del usuario
 *           example: "Quiero un libro barato de programación en buen estado"
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         includeDeleted:
 *           type: boolean
 *           default: false
 *         context:
 *           type: array
 *           description: Contexto opcional enviado por el cliente. Si no se envía, se buscan libros en MongoDB.
 *           items:
 *             oneOf:
 *               - type: string
 *               - type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   text:
 *                     type: string
 */

/**
 * @openapi
 * /recomendaciones:
 *   post:
 *     summary: Genera una recomendación de libros
 *     description: Usa contexto enviado por el cliente o libros recuperados desde MongoDB y llama al LLM remoto para redactar la recomendación.
 *     tags: [Recomendaciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecomendacionRequest'
 *     responses:
 *       200:
 *         description: Recomendación generada correctamente
 *       422:
 *         description: Validación fallida
 *       500:
 *         description: Error interno
 */
router.post('/', ValidateJoi(Schemas.recomendacion.create), controller.recomendarLibros);

/**
 * @openapi
 * /recomendaciones/sync-libros:
 *   post:
 *     summary: Indexa en Weaviate los libros existentes
 *     description: Lee los libros de MongoDB, genera embeddings y los guarda o actualiza en Weaviate.
 *     tags: [Recomendaciones]
 *     responses:
 *       200:
 *         description: Sincronización completada
 *       500:
 *         description: Error interno
 */
router.post('/sync-libros', controller.syncLibrosToWeaviate);

/**
 * @openapi
 * /recomendaciones/health:
 *   get:
 *     summary: Comprueba el estado de IA y Weaviate
 *     tags: [Recomendaciones]
 *     responses:
 *       200:
 *         description: Servicios disponibles
 *       503:
 *         description: Algún servicio no está disponible
 */
router.get('/health', controller.healthCheck);

export default router;
