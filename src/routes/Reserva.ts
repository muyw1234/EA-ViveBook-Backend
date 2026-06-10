import express from 'express';
import controller from '../controllers/Reserva';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { TokenValidation } from '../middleware/verifyToken';

const router = express.Router();

router.post('/', TokenValidation, ValidateJoi(Schemas.reserva.create), controller.solicitarReserva);
router.post(
  '/aceptar/:reservaId',
  TokenValidation,
  ValidateJoi(Schemas.reserva.aceptar),
  controller.aceptarReserva,
);
router.post('/rechazar/:reservaId', TokenValidation, controller.rechazarReserva);
router.get('/solicitadas', TokenValidation, controller.getReservasSolicitadas);
router.get('/recibidas', TokenValidation, controller.getReservasRecibidas);
router.delete('/:reservaId', TokenValidation, controller.deleteReserva);

export default router;
