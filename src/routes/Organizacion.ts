import express from 'express';
import controller from '../controllers/Organizacion';
import { Schemas, ValidateJoi } from '../middleware/Joi';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Organizaciones
 *     description: Endpoints CRUD de organizaciones
 *
 * components:
 *   schemas:
 *     Organizacion:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ObjectId de MongoDB
 *           example: "65f1c2a1b2c3d4e5f6789013"
 *         name:
 *           type: string
 *           example: "EA Company"
 *         usuarios:
 *           type: array
 *           items:
 *             type: string
 *           description: Array de ObjectIds de usuarios
 *           example: ["65f1c2a1b2c3d4e5f6789012"]
 *     OrganizacionCreateUpdate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "EA Company"
 */

/**
 * @openapi
 * /organizaciones:
 *   post:
 *     summary: Crea una organización
 *     tags: [Organizaciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrganizacionCreateUpdate'
 *     responses:
 *       201:
 *         description: Creado
 *       422:
 *         description: Validación fallida (Joi)
 */
router.post('/', ValidateJoi(Schemas.organizacion.create), controller.createOrganizacion);

/**
 * @openapi
 * /organizaciones/{organizacionId}:
 *   get:
 *     summary: Obtiene una organización por ID
 *     tags: [Organizaciones]
 *     parameters:
 *       - in: path
 *         name: organizacionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la organización
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organizacion'
 *       404:
 *         description: No encontrado
 */
router.get('/:organizacionId', controller.readOrganizacion);

/**
 * @openapi
 * /organizaciones:
 *   get:
 *     summary: Lista todas las organizaciones
 *     tags: [Organizaciones]
 *     description: |\n *       Retorna un array de todas las organizaciones.\n *       IMPORTANTE: Cada organización incluye su campo 'usuarios' poblado\n *       mediante el virtual de Mongoose (sin hacer query).
 *     responses:
 *       200:
 *         description: OK - Array de organizaciones con usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Organizacion'
 */
router.get('/', controller.readAll);

/**
 * @openapi
 * /organizaciones/{organizacionId}/usuarios:
 *   get:
 *     summary: Obtiene todos los usuarios de una organización específica
 *     tags: [Organizaciones]
 *     description: |\n *       **NUEVO ENDPOINT - SEMINARIO OPCIÓN B (Virtuals)**\n *       \n *       Filtra todos los usuarios que pertenecen a una organización.\n *       \n *       Implementación:\n *       - Servicio: Usuario.find({ organizacion: organizacionId })\n *       - Optimización: .lean() para retornar objetos JS planos\n *       - Validación: Verifica que la organización existe (404 si no)\n *     parameters:
 *       - in: path
 *         name: organizacionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la organización (24 caracteres hex)
 *         example: "65f1c2a1b2c3d4e5f6789013"
 *     responses:
 *       200:
 *         description: OK - Array de usuarios de esa organización
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Organización no encontrada
 */
router.get('/:organizacionId/usuarios', controller.readUsuariosPorOrganizacion);

/**
 * @openapi
 * /organizaciones/{organizacionId}:
 *   put:
 *     summary: Actualiza una organización por ID
 *     tags: [Organizaciones]
 *     parameters:
 *       - in: path
 *         name: organizacionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la organización
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrganizacionCreateUpdate'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organizacion'
 *       404:
 *         description: No encontrado
 *       422:
 *         description: Validación fallida (Joi)
 */
router.put('/:organizacionId', ValidateJoi(Schemas.organizacion.update), controller.updateOrganizacion);

/**
 * @openapi
 * /organizaciones/{organizacionId}:
 *   delete:
 *     summary: Elimina una organización por ID
 *     tags: [Organizaciones]
 *     description: |\n *       Borra la organización Y todos sus usuarios asociados (borrado en cascada).\n *       \n *       El pre-delete middleware en el modelo Organizacion se ejecuta automáticamente:\n *       1. Busca todos los usuarios de esa organización\n *       2. Los elimina primero (Usuario.deleteMany())\n *       3. Luego elimina la organización\n *       \n *       Esto mantiene la integridad referencial: no hay usuarios huérfanos.
 *     parameters:
 *       - in: path
 *         name: organizacionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId de la organización
 *     responses:
 *       200:
 *         description: Eliminado correctamente (org + todos sus usuarios)
 *       404:
 *         description: No encontrado
 */
// Borra org + todos sus usuarios (cascade delete via pre-delete middleware)
router.delete('/:organizacionId', controller.deleteOrganizacion);

export default router;
