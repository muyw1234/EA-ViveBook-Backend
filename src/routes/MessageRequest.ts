import express from 'express';
import controller from '../controllers/MessageRequest';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { TokenValidation } from '../middleware/verifyToken';

const router = express.Router();

router.post(
  '/',
  TokenValidation,
  ValidateJoi(Schemas.messageRequest.create),
  controller.createMessageRequest,
);
router.get('/received', TokenValidation, controller.getReceivedRequests);
router.get('/sent', TokenValidation, controller.getSentRequests);
router.patch('/:id/accept', TokenValidation, controller.acceptMessageRequest);
router.patch('/:id/deny', TokenValidation, controller.denyMessageRequest);
router.patch('/:id/dismiss', TokenValidation, controller.dismissMessageRequest);

export default router;
