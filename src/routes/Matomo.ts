import express from 'express';
import Matomo from '../controllers/Matomo';
import { TokenValidation } from '../middleware/verifyToken';
const router = express.Router();

// Obtiene la version del cliente
router.get('/version', /*TokenValidation,*/ Matomo.readVersion);
//Obtiene el resumen de las visitas
router.get('/summary', /*TokenValidation,*/ Matomo.readSummary);

// quito la validacion de tokens porque en backoffice con algunos commits

export default router;
