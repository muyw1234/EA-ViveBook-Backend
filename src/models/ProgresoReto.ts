import mongoose, { Document, Schema } from 'mongoose';

export interface IProgresoReto {
  usuario: mongoose.Types.ObjectId;
  reto: mongoose.Types.ObjectId;
  progresoActual: number;
  objetivo: number;
  completado: boolean;
  fechaCompletado?: Date;
}

export interface IProgresoRetoModel extends IProgresoReto, Document {}

const ProgresoRetoSchema: Schema = new Schema(
  {
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    reto: {
      type: Schema.Types.ObjectId,
      ref: 'Reto',
      required: true
    },
    progresoActual: {
      type: Number,
      default: 0,
      min: 0
    },
    objetivo: {
      type: Number,
      required: true,
      min: 1
    },
    completado: {
      type: Boolean,
      default: false
    },
    fechaCompletado: {
      type: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

ProgresoRetoSchema.index({ usuario: 1, reto: 1 }, { unique: true });

export default mongoose.model<IProgresoRetoModel>('ProgresoReto', ProgresoRetoSchema);