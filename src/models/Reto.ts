import mongoose, { Document, Schema } from 'mongoose';

export type TipoReto =
  | 'COMPRAR_LIBROS'
  | 'ALQUILAR_LIBROS'
  | 'SEGUIR_USUARIOS'
  | 'RECIBIR_VALORACIONES'
  | 'ASISTIR_EVENTOS'
  | 'SUBIR_LIBROS';

export interface IReto {
  title: string;
  description: string;
  type: TipoReto;
  objetivo: number;
  activo?: boolean;
}

export interface IRetoModel extends IReto, Document {}

const RetoSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: [
        'COMPRAR_LIBROS',
        'ALQUILAR_LIBROS',
        'SEGUIR_USUARIOS',
        'RECIBIR_VALORACIONES',
        'ASISTIR_EVENTOS',
        'SUBIR_LIBROS'
      ],
      required: true
    },
    objetivo: {
      type: Number,
      required: true,
      min: 1
    },
    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export default mongoose.model<IRetoModel>('Reto', RetoSchema);