import express from 'express';
import controller from '../controllers/Chat';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { TokenValidation } from '../middleware/verifyToken';

const router = express.Router();

router.post('/', TokenValidation, ValidateJoi(Schemas.chat.create), controller.createChat);
router.get('/', TokenValidation, controller.getAllChats);
router.get('/usuario/:usuarioId', TokenValidation, controller.getAllChats); // Fallback compatible
router.get('/:chatId', TokenValidation, controller.getChat);
router.delete('/:chatId', TokenValidation, controller.deleteChat);

router.get('/:id/messages', TokenValidation, controller.getChatMessages);
router.post('/:id/messages', TokenValidation, controller.sendChatMessage);
router.patch('/:id/read', TokenValidation, controller.markChatAsRead);

export default router;
