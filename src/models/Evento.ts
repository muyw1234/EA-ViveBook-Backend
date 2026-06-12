import mongoose, { Document, Schema } from 'mongoose';

export interface IPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface IEvento {
  title: string;
  description: string;
  creator: mongoose.Types.ObjectId | string;
  participant: (mongoose.Types.ObjectId | string)[];
  eventDate: Date;
  createdDate: Date;
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
    creator: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    participant: [{ type: Schema.Types.ObjectId, ref: 'Usuario', default: [] }],
    eventDate: { type: Date, required: true },
    createdDate: { type: Date, required: true },
    location: { type: pointSchema, required: true },
    direccionExacta: { type: String, required: true },
    IsDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

EventoSchema.index({ location: '2dsphere' });
EventoSchema.index({ title: 'text', description: 'text', direccionExacta: 'text' });

export default mongoose.model<IEventoModel>('Evento', EventoSchema);
