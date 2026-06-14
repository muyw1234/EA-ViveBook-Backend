import express from 'express';
import controller from '../../controllers/Usuario';
import { isAdmin } from '../../middleware/AuthRole';
import { Schemas, ValidateJoi } from '../../middleware/Joi';
import { TokenValidation } from '../../middleware/verifyToken';

const router = express.Router();

router.use(TokenValidation, isAdmin);

/**
 * @openapi
 * tags:
 *   - name: Admin - Usuarios
 *     description: CRUD administrativo de usuarios para el BackOffice.
 * components:
 *   schemas:
 *     AdminUsuarioWrite:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Se usa al crear o se cambia cuando se envía explícitamente. Nunca se devuelve.
 *         rol:
 *           type: string
 *           enum: [Admin, User]
 *         avatar:
 *           type: string
 *           format: uri
 *           nullable: true
 *         libros:
 *           type: array
 *           items:
 *             type: string
 *         boughtLibros:
 *           type: array
 *           items: { type: string }
 *         rentedLibros:
 *           type: array
 *           items: { type: string }
 *         favoriteAuthors:
 *           type: array
 *           maxItems: 5
 *           items: { type: string }
 *         favoriteBooks:
 *           type: array
 *           items: { type: string }
 *         favoriteCategories:
 *           type: array
 *           items: { type: string }
 *         wishlist:
 *           type: array
 *           items: { type: string }
 *         followingUsers:
 *           type: array
 *           items: { type: string }
 *         favoritos:
 *           type: array
 *           items: { type: string }
 *         notificationUsersEnabled:
 *           type: array
 *           items: { type: string }
 *         description:
 *           type: string
 *         IsDeleted:
 *           type: boolean
 *         hasSeenTutorial:
 *           type: boolean
 *     AdminUsuarioCreate:
 *       allOf:
 *         - $ref: '#/components/schemas/AdminUsuarioWrite'
 *       required: [name, email, password]
 *     AdminUsuario:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         rol:
 *           type: string
 *           enum: [Admin, User]
 *         avatar:
 *           type: string
 *           nullable: true
 *         libros:
 *           type: array
 *           items:
 *             oneOf:
 *               - type: string
 *               - type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   title:
 *                     type: string
 *         description:
 *           type: string
 *         IsDeleted:
 *           type: boolean
 *         hasSeenTutorial:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AdminUsuarioStatus:
 *       type: object
 *       required: [IsDeleted]
 *       properties:
 *         IsDeleted:
 *           type: boolean
 *     AdminUsuarioResponse:
 *       type: object
 *       required: [success, status, message, data]
 *       properties:
 *         success:
 *           type: boolean
 *         status:
 *           type: integer
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/AdminUsuario'
 *     AdminUsuariosPage:
 *       type: object
 *       required: [data, pagination]
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdminUsuario'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     AdminUsuariosPageResponse:
 *       type: object
 *       required: [success, status, message, data]
 *       properties:
 *         success:
 *           type: boolean
 *         status:
 *           type: integer
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/AdminUsuariosPage'
 */

/**
 * @openapi
 * /admin/usuarios:
 *   get:
 *     summary: Lista usuarios para el BackOffice
 *     tags: [Admin - Usuarios]
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
 *           enum: [name, email, role, _id]
 *           default: name
 *         description: Campo permitido sobre el que se aplica la búsqueda.
 *       - in: query
 *         name: includeDeleted
 *         schema: { type: boolean, default: true }
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [Admin, User]
 *     responses:
 *       200:
 *         description: Página de usuarios obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminUsuariosPageResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   post:
 *     summary: Crea un usuario local desde el BackOffice
 *     tags: [Admin - Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUsuarioCreate'
 *     responses:
 *       201:
 *         description: Usuario creado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminUsuarioResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 */
router.get('/', controller.getAdminUsuarios);
router.post('/', ValidateJoi(Schemas.usuario.adminCreate), controller.createAdminUsuario);

/**
 * @openapi
 * /admin/usuarios/{usuarioId}/status:
 *   patch:
 *     summary: Activa o desactiva un usuario
 *     tags: [Admin - Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUsuarioStatus'
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminUsuarioResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 */
router.patch(
  '/:usuarioId/status',
  ValidateJoi(Schemas.usuario.status),
  controller.setAdminUsuarioStatus,
);

/**
 * @openapi
 * /admin/usuarios/{usuarioId}/permanent:
 *   delete:
 *     summary: Elimina definitivamente un usuario
 *     description: Elimina físicamente el documento. Esta acción no se puede deshacer.
 *     tags: [Admin - Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Usuario eliminado definitivamente.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:usuarioId/permanent', controller.permanentDeleteUsuario);

/**
 * @openapi
 * /admin/usuarios/{usuarioId}:
 *   get:
 *     summary: Obtiene el detalle administrativo de un usuario
 *     tags: [Admin - Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Usuario obtenido correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminUsuarioResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Actualiza un usuario
 *     tags: [Admin - Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUsuarioWrite'
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminUsuarioResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationFailed'
 *   delete:
 *     summary: Desactiva un usuario
 *     description: Realiza un borrado lógico estableciendo IsDeleted en true.
 *     tags: [Admin - Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Usuario desactivado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminUsuarioResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:usuarioId', controller.getAdminUsuario);
router.put('/:usuarioId', ValidateJoi(Schemas.usuario.adminUpdate), controller.updateAdminUsuario);
router.delete('/:usuarioId', controller.deactivateAdminUsuario);

export default router;
