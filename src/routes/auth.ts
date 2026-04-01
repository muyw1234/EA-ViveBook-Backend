import express from 'express';
import Auth from '../controllers/auth';
import Joi from 'joi';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import Usuario from '../controllers/Usuario';
import { TokenValidation } from '../middleware/verifyToken';
// Schemas de validación para auth, no necesario ya existen, alguien estubo vibe codeando
// const loginSchema = Joi.object({
//     email: Joi.string().email().required(),
//     password: Joi.string().required()
// });

const router = express.Router();
/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Endpoints de autenticación
 */

/**
 * @openapi
 * /auth/signin:
 *   post:
 *     summary: Inicia sesión y devuelve el JWT
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: carlos@gmail.com
 *               password:
 *                 type: string
 *                 example: el secreto esta en la masa
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve token
 *       401:
 *         description: Credenciales incorrectas
 */
router.post('/signin', ValidateJoi(Schemas.signIn), Auth.signin);

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     summary: Registro de usuario
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Datos necesarios para crear un usuario
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del usuario
 *                 example: User X
 *               email:
 *                 type: string
 *                 description: Correo electrónico del usuario
 *                 example: uX@gmail.com
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *                 example: 123456789
 *               libros:
 *                 type: array
 *                 description: Lista de IDs de libros asociados al usuario
 *                 items:
 *                   type: string
 *                 example:
 *                   - 65f1c2a1b2c3d4e5f6789012
 *                   - 65f1c2a1b2c3d4e5f6789013
 *               IsDeleted:
 *                 type: boolean
 *                 description: Indica si el usuario ha sido eliminado lógicamente
 *                 example: false
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Representa un usuario en la base de datos
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ObjectId de MongoDB
 *                   example: 65f1c2a1b2c3d4e5f6789012
 *                 name:
 *                   type: string
 *                   description: Nombre del usuario
 *                   example: Judit
 *                 email:
 *                   type: string
 *                   description: Correo electrónico del usuario
 *                   example: judit@gmail.com
 *                 password:
 *                   type: string
 *                   description: Contraseña del usuario
 *                   example: password123
 *                 libros:
 *                   type: array
 *                   description: Lista de IDs de libros asociados al usuario
 *                   items:
 *                     type: string
 *                   example:
 *                     - 65f1c2a1b2c3d4e5f6789012
 *                     - 65f1c2a1b2c3d4e5f6789013
 *                 IsDeleted:
 *                   type: boolean
 *                   description: Indica si el usuario ha sido eliminado lógicamente
 *                   example: false
 *       400:
 *         description: Datos inválidos o error en el registro
 */
router.post('/signup', ValidateJoi(Schemas.usuario.create), Auth.signup);

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Representa un usuario en la base de datos
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ObjectId de MongoDB
 *                   example: 65f1c2a1b2c3d4e5f6789012
 *                 name:
 *                   type: string
 *                   description: Nombre del usuario
 *                   example: Judit
 *                 email:
 *                   type: string
 *                   description: Correo electrónico del usuario
 *                   example: judit@gmail.com
 *                 password:
 *                   type: string
 *                   description: Contraseña del usuario
 *                   example: password123
 *                 libros:
 *                   type: array
 *                   description: Lista de IDs de libros asociados al usuario
 *                   items:
 *                     type: string
 *                   example:
 *                     - 65f1c2a1b2c3d4e5f6789012
 *                     - 65f1c2a1b2c3d4e5f6789013
 *                 IsDeleted:
 *                   type: boolean
 *                   description: Indica si el usuario ha sido eliminado lógicamente
 *                   example: false
 *       401:
 *         description: No autorizado, token inválido o ausente
 */
router.get('/profile', TokenValidation, Auth.profile);

export default router;
