import mongoose, { Document, Schema } from 'mongoose';

export interface IPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface IEvento {
  title: string;
  description: string;
  date: Date;
  location: IPoint;
  direccionExacta: string;
  IsDeleted?: boolean;
}

const pointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  { _id: false },
);

export interface IEventoModel extends IEvento, Document {}

const EventoSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: pointSchema, required: true },
    direccionExacta: { type: String, required: true }, // Verified required
    IsDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

EventoSchema.index({ location: '2dsphere' });

export default mongoose.model<IEventoModel>('Evento', EventoSchema);
