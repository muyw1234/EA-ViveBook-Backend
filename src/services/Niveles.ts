import Reto from '../models/Reto';
import ProgresoReto from '../models/ProgresoReto';

export interface UserLevelInfo {
    totalChallengesCount: number;
    completedChallengesCount: number;
    userLevel: 'Bronce' | 'Plata' | 'Oro' | null;
    userLevelEmoji: '🥉' | '🥈' | '🥇' | null;
}

/**
 * Calcula el nivel del usuario basándose en los retos activos completados.
 * @param usuarioId ID del usuario
 * @returns UserLevelInfo
 */
export const getUserLevel = async (usuarioId: string): Promise<UserLevelInfo> => {
    try {
        const totalChallengesCount = await Reto.countDocuments({ activo: true });
        const completedChallengesCount = await ProgresoReto.countDocuments({
            usuario: usuarioId,
            completado: true
        });

        let userLevel: UserLevelInfo['userLevel'] = null;
        let userLevelEmoji: UserLevelInfo['userLevelEmoji'] = null;

        if (totalChallengesCount > 0) {
            if (completedChallengesCount >= totalChallengesCount) {
                userLevel = 'Oro';
                userLevelEmoji = '🥇';
            } else if (completedChallengesCount >= Math.ceil(totalChallengesCount / 2)) {
                userLevel = 'Plata';
                userLevelEmoji = '🥈';
            } else if (completedChallengesCount >= 3) {
                userLevel = 'Bronce';
                userLevelEmoji = '🥉';
            }
        } else {
            // Si no hay retos disponibles, la regla era que si completó los pocos que había antes de desactivarlos (o si hay 0 totales activos)
            // Para proteger de errores:
            if (completedChallengesCount >= 3) {
                userLevel = 'Bronce';
                userLevelEmoji = '🥉';
            }
        }

        return {
            totalChallengesCount,
            completedChallengesCount,
            userLevel,
            userLevelEmoji
        };
    } catch (error) {
        console.error('Error calculating user level:', error);
        return {
            totalChallengesCount: 0,
            completedChallengesCount: 0,
            userLevel: null,
            userLevelEmoji: null
        };
    }
};

export default {
    getUserLevel
};
