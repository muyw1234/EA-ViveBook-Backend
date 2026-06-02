import express from 'express';
import controller from '../controllers/Usuario';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { isAdmin, isSelfOrAdmin } from '../middleware/AuthRole';
import { TokenValidation, encryptPassword } from '../middleware/verifyToken';
const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Usuarios
 *     description: Endpoints CRUD de usuarios
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       description: Representa un usuario en la base de datos
 *       properties:
 *         _id:
 *           type: string
 *           description: ObjectId de MongoDB
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *         name:
 *           type: string
 *           description: Nombre del usuario
 *           example: "Judit"
 *         email:
 *           type: string
 *           description: Correo electrónico del usuario
 *           example: "judit@gmail.com"
 *         password:
 *           type: string
 *           description: Contraseña del usuario
 *           example: "password123"
 *         libros:
 *           type: array
 *           description: Lista de IDs de libros asociados al usuario
 *           items:
 *             type: string
 *           example:
 *             - "65f1c2a1b2c3d4e5f6789012"
 *             - "65f1c2a1b2c3d4e5f6789013"
 *         IsDeleted:
 *           type: boolean
 *           description: Indica si el usuario ha sido eliminado lógicamente
 *           example: false
 *     UsuarioCreateUpdate:
 *       type: object
 *       description: Datos necesarios para crear o actualizar un usuario
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del usuario
 *           example: "User X"
 *         email:
 *           type: string
 *           description: Correo electrónico del usuario
 *           example: "uX@gmail.com"
 *         password:
 *           type: string
 *           description: Contraseña del usuario
 *           example: "123456789"
 *         libros:
 *           type: array
 *           description: Lista de IDs de libros asociados al usuario
 *           items:
 *             type: string
 *           example:
 *             - "65f1c2a1b2c3d4e5f6789012"
 *             - "65f1c2a1b2c3d4e5f6789013"
 *         IsDeleted:
 *           type: boolean
 *           description: Indica si el usuario ha sido eliminado lógicamente
 *           example: false
 */

/**
 * @openapi
 * /usuarios:
 *   post:
 *     summary: Crear un usuario
 *     description: Crea un nuevo usuario en la base de datos.
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       description: Datos del usuario a crear
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioCreateUpdate'
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       422:
 *         description: Error de validación en los datos enviados
 */
router.post('/', encryptPassword, ValidateJoi(Schemas.usuario.create), controller.createUsuario);

/**
 * @openapi
 * /usuarios/all:
 *   get:
 *     summary: Listar todos los usuarios
 *     description: Recupera la lista completa de usuarios registrados.
 *     tags:
 *       - Usuarios
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
 *         description: Lista paginada de usuarios obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Usuario'
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
router.get('/all', controller.getAllUsuarios);

/**
 * @openapi
 * /usuarios/search:
 *   get:
 *     summary: Buscar usuarios por nombre
 *     description: Retorna una lista de usuarios cuyo nombre coincida parcial o totalmente con el término de búsqueda. Incluye paginación.
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: query
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *         description: Término o palabra clave para buscar en el nombre del usuario.
 *         example: "Judit"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para la paginación.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de resultados por página.
 *     responses:
 *       200:
 *         description: Lista de usuarios encontrados exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Error en la solicitud o en la base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   description: Detalles del error capturado.
 *       404:
 *         description: No se encontraron usuarios que coincidan con el término de búsqueda.
 */
router.get('/search', controller.searchUsuarioByName);

/**
 * @openapi
 * /usuarios/{usuarioId}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     description: Recupera la información de un usuario a partir de su identificador.
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         description: ID del usuario en MongoDB
 *         schema:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *     responses:
 *       200:
 *         description: Usuario obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:usuarioId', TokenValidation, controller.getUsuario);

/**
 * @openapi
 * /usuarios/{usuarioId}/followers:
 *   get:
 *     summary: Obtener los seguidores de un usuario
 *     description: Recupera la lista de usuarios que siguen a un usuario especifico.
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         description: ID del usuario en MongoDB
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Seguidores obtenidos correctamente
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:usuarioId/followers', TokenValidation, controller.getFollowers);

/**
 * @openapi
 * /usuarios:
 *   get:
 *     summary: Listar usuarios no eliminados
 *     description: Recupera la lista de usuarios que no han sido eliminados lógicamente.
 *     tags:
 *       - Usuarios
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
 *         description: Lista paginada de usuarios obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Usuario'
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
router.get('/', TokenValidation, controller.getAllUsuarios_NOT_Deleted);

/**
 * @openapi
 * /usuarios/{usuarioId}:
 *   put:
 *     summary: Actualizar un usuario por ID
 *     description: Actualiza los datos de un usuario existente a partir de su identificador.
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         description: ID del usuario en MongoDB
 *         schema:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *     requestBody:
 *       required: true
 *       description: Datos del usuario a actualizar
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioCreateUpdate'
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuario no encontrado
 *       422:
 *         description: Error de validación en los datos enviados
 */
router.put('/:usuarioId', TokenValidation, isSelfOrAdmin, ValidateJoi(Schemas.usuario.update), controller.updateUsuario);

/**
 * @openapi
 * /usuarios/{usuarioId}:
 *   delete:
 *     summary: Eliminar un usuario por ID
 *     description: Elimina un usuario existente a partir de su identificador.
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         description: ID del usuario en MongoDB
 *         schema:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/:usuarioId', TokenValidation, isSelfOrAdmin, controller.deleteUsuario);

/**
 * @openapi
 * /usuarios/permanent/{usuarioId}:
 *   delete:
 *     summary: Eliminar permanentemente un usuario por ID
 *     description: Elimina de forma permanente un usuario existente a partir de su identificador.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         description: ID del usuario en MongoDB
 *         schema:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *     responses:
 *       204:
 *         description: Usuario eliminado permanentemente
 *       401:
 *         description: No autorizado, token invalido o ausente
 *       403:
 *         description: Acceso denegado, se requiere rol de administrador
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/permanent/:usuarioId', TokenValidation, isSelfOrAdmin, controller.permanentDeleteUsuario);

/**
 * @openapi
 * /usuarios/restore/{usuarioId}:
 *   put:
 *     summary: Restaurar un usuario eliminado
 *     description: Cambia el estado IsDeleted a false para que el usuario vuelva a estar operativo.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         description: ID del usuario en MongoDB
 *         schema:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789012"
 *     responses:
 *       200:
 *         description: Usuario restaurado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autorizado, token invalido o ausente
 *       403:
 *         description: Acceso denegado, se requiere rol de administrador
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/restore/:usuarioId', TokenValidation, isAdmin, controller.restoreUsuario);

router.post('/wishlist/:libroId', TokenValidation, controller.toggleWishlist);
router.post('/favoritos/:libroId', TokenValidation, controller.toggleFavorite);

export default router;
