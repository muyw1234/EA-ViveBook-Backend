import mongoose from 'mongoose';
import Valoracion, { IValoracionModel, IValoracion } from '../models/Valoracion';
import Usuario from '../models/Usuario';
import Libro from '../models/Libro';
import Logging from '../library/Logging';

const createValoracion = async (data: Partial<IValoracion>): Promise<IValoracionModel | null> => {
  const { usuarioAutor, usuarioValorado, libro, tipoOperacion, reservationId } = data;

  // 1. Check self-rating
  if (usuarioAutor === usuarioValorado) {
    throw new Error('No puedes valorarte a ti mismo');
  }

  // 2. Validate user exists
  const user = await Usuario.findById(usuarioAutor);
  if (!user) {
    Logging.error(`Valoracion error: Autor ${usuarioAutor} no encontrado`);
    throw new Error('Usuario autor no encontrado');
  }

  // 3. Check for existing rating for the transition
  let existing = null;
  if (reservationId) {
    existing = await Valoracion.findOne({
      usuarioAutor: new mongoose.Types.ObjectId(usuarioAutor),
      reservationId: new mongoose.Types.ObjectId(reservationId as string),
    });
  } else {
    existing = await Valoracion.findOne({
      usuarioAutor: new mongoose.Types.ObjectId(usuarioAutor),
      libro: new mongoose.Types.ObjectId(libro as string),
      tipoOperacion: tipoOperacion,
    });
  }

  if (existing) {
    Logging.error(`Valoracion error: Ya existe una valoración para esta operación`);
    throw new Error('Ya has valorado esta transacción');
  }

  const valoracion = new Valoracion({
    _id: new mongoose.Types.ObjectId(),
    ...data,
  });

  return await valoracion.save();
};

const getValoracionesReceived = async (usuarioId: string): Promise<IValoracionModel[]> => {
  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    Logging.warning(`Invalid usuarioId for valoraciones: ${usuarioId}`);
    return [];
  }
  return await Valoracion.find({ usuarioValorado: new mongoose.Types.ObjectId(usuarioId) })
    .populate('usuarioAutor', 'name')
    .populate('libro', 'title')
    .sort({ createdAt: -1 });
};

const getValoracionesSent = async (usuarioId: string): Promise<IValoracionModel[]> => {
  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    Logging.warning(`Invalid usuarioId for sent valoraciones: ${usuarioId}`);
    return [];
  }
  return await Valoracion.find({ usuarioAutor: new mongoose.Types.ObjectId(usuarioId) });
};

const getRatingStats = async (usuarioId: string) => {
  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    return { averageRating: 0, totalReviews: 0 };
  }
  const stats = await Valoracion.aggregate([
    { $match: { usuarioValorado: new mongoose.Types.ObjectId(usuarioId) } },
    {
      $group: {
        _id: '$usuarioValorado',
        averageRating: { $avg: '$puntuacion' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  return {
    averageRating: parseFloat(stats[0].averageRating.toFixed(1)),
    totalReviews: stats[0].totalReviews,
  };
};

export default {
  createValoracion,
  getValoracionesReceived,
  getValoracionesSent,
  getRatingStats,
};
