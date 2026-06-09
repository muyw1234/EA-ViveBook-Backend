import express from 'express';
import controller from '../controllers/Mensaje';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { TokenValidation } from '../middleware/verifyToken';

const router = express.Router();

router.post('/', TokenValidation, ValidateJoi(Schemas.mensaje.create), controller.createMensaje);
router.get('/chat/:chatId', TokenValidation, controller.getMensajesByChat);
router.get('/reservas', TokenValidation, controller.getReservasMensajes);
router.get('/unread-count', TokenValidation, controller.getUnreadCount);
router.patch('/chat/:chatId/read', TokenValidation, controller.markGeneralAsRead);
router.patch('/reservas/read', TokenValidation, controller.markReservationsAsRead);
router.delete('/:mensajeId', TokenValidation, controller.deleteMensaje);

export default router;
