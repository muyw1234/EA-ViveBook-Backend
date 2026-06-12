import { FilterQuery } from 'mongoose';
import Reto, { IReto, IRetoModel, TipoReto } from '../models/Reto';
import ProgresoReto from '../models/ProgresoReto';
import { getPagination, PaginatedResult } from './Pagination';

export type AdminRetoQuery = {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
  type?: TipoReto;
};

const retosIniciales: {
  title: string;
  description: string;
  type: TipoReto;
  objetivo: number;
}[] = [
  {
    title: 'Comprar 1 libro',
    description: 'Compra tu primer libro en ViveBooks.',
    type: 'COMPRAR_LIBROS',
    objetivo: 1,
  },
  {
    title: 'Comprar 5 libros',
    description: 'Compra 5 libros en ViveBooks.',
    type: 'COMPRAR_LIBROS',
    objetivo: 5,
  },
  {
    title: 'Comprar 10 libros',
    description: 'Compra 10 libros en ViveBooks.',
    type: 'COMPRAR_LIBROS',
    objetivo: 10,
  },
  {
    title: 'Alquilar 1 libro',
    description: 'Alquila tu primer libro en ViveBooks.',
    type: 'ALQUILAR_LIBROS',
    objetivo: 1,
  },
  {
    title: 'Alquilar 5 libros',
    description: 'Alquila 5 libros en ViveBooks.',
    type: 'ALQUILAR_LIBROS',
    objetivo: 5,
  },
  {
    title: 'Alquilar 10 libros',
    description: 'Alquila 10 libros en ViveBooks.',
    type: 'ALQUILAR_LIBROS',
    objetivo: 10,
  },
  {
    title: 'Seguir a 1 usuario',
    description: 'Sigue a tu primer usuario de la comunidad.',
    type: 'SEGUIR_USUARIOS',
    objetivo: 1,
  },
  {
    title: 'Seguir a 5 usuarios',
    description: 'Sigue a 5 usuarios de la comunidad.',
    type: 'SEGUIR_USUARIOS',
    objetivo: 5,
  },
  {
    title: 'Seguir a 10 usuarios',
    description: 'Sigue a 10 usuarios de la comunidad.',
    type: 'SEGUIR_USUARIOS',
    objetivo: 10,
  },
  {
    title: 'Recibe 1 valoración',
    description: 'Recibe tu primera valoración de otro usuario.',
    type: 'RECIBIR_VALORACIONES',
    objetivo: 1,
  },
  {
    title: 'Recibe 5 valoraciones',
    description: 'Recibe 5 valoraciones de otros usuarios.',
    type: 'RECIBIR_VALORACIONES',
    objetivo: 5,
  },
  {
    title: 'Recibe 10 valoraciones',
    description: 'Recibe 10 valoraciones de otros usuarios.',
    type: 'RECIBIR_VALORACIONES',
    objetivo: 10,
  },
  {
    title: 'Asiste a 1 evento',
    description: 'Apúntate a tu primer evento de ViveBooks.',
    type: 'ASISTIR_EVENTOS',
    objetivo: 1,
  },
  {
    title: 'Asiste a 5 eventos',
    description: 'Apúntate a 5 eventos de ViveBooks.',
    type: 'ASISTIR_EVENTOS',
    objetivo: 5,
  },
  {
    title: 'Asiste a 10 eventos',
    description: 'Apúntate a 10 eventos de ViveBooks.',
    type: 'ASISTIR_EVENTOS',
    objetivo: 10,
  },
  {
    title: 'Sube 1 libro',
    description: 'Sube tu primer libro a ViveBooks.',
    type: 'SUBIR_LIBROS',
    objetivo: 1,
  },
  {
    title: 'Sube 5 libros',
    description: 'Sube 5 libros a ViveBooks.',
    type: 'SUBIR_LIBROS',
    objetivo: 5,
  },
  {
    title: 'Sube 10 libros',
    description: 'Sube 10 libros a ViveBooks.',
    type: 'SUBIR_LIBROS',
    objetivo: 10,
  },
];

export const inicializarRetos = async () => {
  const existingRetos = await Reto.countDocuments();
  if (existingRetos > 0) return;
  await Reto.insertMany(retosIniciales);
};

export const actualizarProgresoRetos = async (
  usuarioId: string,
  tipo: TipoReto,
  incremento: number = 1,
) => {
  const retos = await Reto.find({
    type: tipo,
    activo: true,
  });

  for (const reto of retos) {
    let progreso = await ProgresoReto.findOne({
      usuario: usuarioId,
      reto: reto._id,
    });

    if (!progreso) {
      progreso = new ProgresoReto({
        usuario: usuarioId,
        reto: reto._id,
        progresoActual: 0,
        objetivo: reto.objetivo,
        completado: false,
      });
    }

    if (!progreso.completado) {
      progreso.progresoActual += incremento;

      if (progreso.progresoActual >= progreso.objetivo) {
        progreso.progresoActual = progreso.objetivo;
        progreso.completado = true;
        progreso.fechaCompletado = new Date();
      }

      await progreso.save();
    }
  }
};

export const obtenerMisRetos = async (usuarioId: string, page: number = 1, limit: number = 10) => {
  const pagination = getPagination(page, limit);
  const [retos, total] = await Promise.all([
    Reto.find({
      activo: true,
    })
      .sort({
        type: 1,
        objetivo: 1,
      })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Reto.countDocuments({ activo: true }),
  ]);

  const resultado = [];

  for (const reto of retos) {
    let progreso = await ProgresoReto.findOne({
      usuario: usuarioId,
      reto: reto._id,
    });

    if (!progreso) {
      progreso = await ProgresoReto.create({
        usuario: usuarioId,
        reto: reto._id,
        progresoActual: 0,
        objetivo: reto.objetivo,
        completado: false,
      });
    }

    const porcentaje = Math.min(
      100,
      Math.round((progreso.progresoActual / progreso.objetivo) * 100),
    );

    resultado.push({
      _id: reto._id,
      title: reto.title,
      description: reto.description,
      type: reto.type,
      objetivo: reto.objetivo,
      progresoActual: progreso.progresoActual,
      porcentaje,
      completado: progreso.completado,
      fechaCompletado: progreso.fechaCompletado,
    });
  }

  return {
    data: resultado,
    pagination: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

export const getAdminRetos = async ({
  page = 1,
  limit = 10,
  search = '',
  includeInactive = true,
  type,
}: AdminRetoQuery): Promise<PaginatedResult<IRetoModel>> => {
  const pagination = getPagination(page, limit);
  const filter: FilterQuery<IRetoModel> = {};
  const normalizedSearch = search.trim();

  if (!includeInactive) filter.activo = true;
  if (type) filter.type = type;
  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } },
      { type: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    Reto.find(filter)
      .sort({ activo: -1, type: 1, objetivo: 1, _id: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Reto.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

export const getAdminReto = async (id: string): Promise<IRetoModel | null> => Reto.findById(id);

export const createAdminReto = async (data: Partial<IReto>): Promise<IRetoModel> =>
  Reto.create(data);

export const updateAdminReto = async (
  id: string,
  data: Partial<IReto>,
): Promise<IRetoModel | null> => {
  const reto = await Reto.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!reto) return null;

  if (data.objetivo !== undefined) {
    const progresos = await ProgresoReto.find({ reto: id });
    for (const progreso of progresos) {
      progreso.objetivo = reto.objetivo;
      progreso.progresoActual = Math.min(progreso.progresoActual, reto.objetivo);
      progreso.completado = progreso.progresoActual >= reto.objetivo;
      progreso.fechaCompletado = progreso.completado
        ? (progreso.fechaCompletado ?? new Date())
        : undefined;
      await progreso.save();
    }
  }

  return reto;
};

export const setRetoActivo = async (id: string, activo: boolean): Promise<IRetoModel | null> =>
  updateAdminReto(id, { activo });
