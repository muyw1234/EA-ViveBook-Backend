import express from 'express';
import Image from '../controllers/Image';
import { TokenValidation } from '../middleware/verifyToken';

const router = express.Router();

/**
 * @openapi
 * /image/token:
 *   get:
 *     summary: Obtener firma y timestamp para subir imágenes a Cloudinary
 *     description: Genera una firma segura (signature) y un timestamp del lado del servidor para permitir la carga directa de imágenes a Cloudinary desde el frontend sin exponer credenciales sensibles.
 *     tags:
 *       - Imágenes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Firma y timestamp generados exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: object
 *                   description: Objeto que contiene las credenciales temporales de Cloudinary.
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       description: Marca de tiempo en segundos utilizada para la firma.
 *                       example: "1779438461"
 *                     signature:
 *                       type: string
 *                       description: Firma criptográfica SHA-1 generada con el API Secret.
 *                       example: "a8f9b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"
 *       401:
 *         description: No autorizado. Falta el token de sesión o es inválido.
 *       403:
 *         description: Prohibido o error al generar la firma de Cloudinary.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje descriptivo del error.
 *                   example: "Error al generar el token de imágenes"
 */
router.get('/token', TokenValidation, Image.getToken);

export default router;
