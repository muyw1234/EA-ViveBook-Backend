import express from 'express';
import controller from '../controllers/Retos';
import { TokenValidation } from '../middleware/verifyToken';

const router = express.Router();

router.get('/', controller.getRetos);
router.get('/mis-retos', TokenValidation, controller.getMisRetos);

export default router;
