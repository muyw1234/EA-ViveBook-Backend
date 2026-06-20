import express from 'express';
import controller from '../controllers/Valoracion';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { TokenValidation } from '../middleware/verifyToken';

const router = express.Router();

router.post(
  '/',
  TokenValidation,
  ValidateJoi(Schemas.valoracion.create),
  controller.createValoracion,
);
router.get('/sent', TokenValidation, controller.getValoracionesSent);
router.get('/received/:usuarioId', TokenValidation, controller.getValoracionesReceived);

export default router;
