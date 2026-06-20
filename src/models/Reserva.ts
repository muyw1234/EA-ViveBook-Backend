import mongoose, { Document, Schema } from 'mongoose';

export interface IReserva {
  libro: mongoose.Types.ObjectId | string;
  usuarioSolicitante: mongoose.Types.ObjectId | string;
  propietario: mongoose.Types.ObjectId | string;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  fechaSolicitud: Date;
  fechaLimite?: Date;
  deletedBy?: Array<mongoose.Types.ObjectId | string>;
  IsDeleted?: boolean;
}

export interface IReservaModel extends IReserva, Document {}

const ReservaSchema: Schema = new Schema(
  {
    libro: { type: Schema.Types.ObjectId, ref: 'Libro', required: true },
    usuarioSolicitante: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    propietario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    estado: {
      type: String,
      enum: ['PENDIENTE', 'ACEPTADA', 'RECHAZADA'],
      default: 'PENDIENTE',
      required: true,
    },
    fechaSolicitud: { type: Date, default: Date.now, required: true },
    fechaLimite: { type: Date, required: false },
    deletedBy: [{ type: Schema.Types.ObjectId, ref: 'Usuario', default: [] }],
    IsDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model<IReservaModel>('Reserva', ReservaSchema);
