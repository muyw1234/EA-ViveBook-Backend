import mongoose, { Document, Schema } from 'mongoose';

export interface IValoracion {
  usuarioAutor: mongoose.Types.ObjectId | string;
  usuarioValorado: mongoose.Types.ObjectId | string;
  libro: mongoose.Types.ObjectId | string;
  tipoOperacion: 'VENTA' | 'ALQUILER' | 'RESERVA';
  puntuacion: number;
  comentario?: string;
  reservationId?: mongoose.Types.ObjectId | string;
  IsDeleted?: boolean;
}

export interface IValoracionModel extends IValoracion, Document {}

const ValoracionSchema: Schema = new Schema(
  {
    usuarioAutor: { type: Schema.Types.ObjectId, required: true, ref: 'Usuario' },
    usuarioValorado: { type: Schema.Types.ObjectId, required: true, ref: 'Usuario' },
    libro: { type: Schema.Types.ObjectId, required: true, ref: 'Libro' },
    tipoOperacion: { type: String, enum: ['VENTA', 'ALQUILER', 'RESERVA'], required: true },
    puntuacion: { type: Number, required: true, min: 1, max: 5 },
    comentario: { type: String, required: false, default: '' },
    reservationId: { type: Schema.Types.ObjectId, ref: 'Reserva', required: false },
    IsDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes to enforce single rating per transition
ValoracionSchema.index({ usuarioAutor: 1, libro: 1, tipoOperacion: 1 }, { unique: true });
ValoracionSchema.index({ usuarioAutor: 1, reservationId: 1 }, { unique: true, sparse: true });
ValoracionSchema.index({ comentario: 'text' });

export default mongoose.model<IValoracionModel>('Valoracion', ValoracionSchema);
