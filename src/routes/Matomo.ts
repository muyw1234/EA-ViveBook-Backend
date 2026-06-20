import express from 'express';
import Matomo from '../controllers/Matomo';
import { isAdmin } from '../middleware/AuthRole';
import { TokenValidation } from '../middleware/verifyToken';

const router = express.Router();

router.use(TokenValidation, isAdmin);

/**
 * @openapi
 * tags:
 *   - name: Admin - Estadísticas
 *     description: Métricas administrativas obtenidas desde la instancia externa de Matomo.
 * components:
 *   schemas:
 *     MatomoVersion:
 *       type: object
 *       required: [version]
 *       properties:
 *         version:
 *           type: string
 *     MatomoVisitsSummary:
 *       type: object
 *       properties:
 *         nb_uniq_visitors: { type: number }
 *         nb_users: { type: number }
 *         nb_visits: { type: number }
 *         nb_actions: { type: number }
 *         nb_visits_converted: { type: number }
 *         bounce_count: { type: number }
 *         sum_visit_length: { type: number }
 *         max_actions: { type: number }
 *         bounce_rate: { type: string }
 *         nb_actions_per_visit: { type: number }
 *         avg_time_on_site: { type: number }
 */

/**
 * @openapi
 * /matomo/version:
 *   get:
 *     summary: Comprueba la conexión y obtiene la versión de Matomo
 *     tags: [Admin - Estadísticas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Versión obtenida correctamente.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/version', Matomo.readVersion);

/**
 * @openapi
 * /matomo/summary:
 *   get:
 *     summary: Obtiene el resumen semanal de visitas de Matomo
 *     description: Consulta el sitio 1, con periodo semanal y fecha actual.
 *     tags: [Admin - Estadísticas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen obtenido correctamente.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/summary', Matomo.readSummary);

export default router;
