import mongoose, { Document, Schema } from 'mongoose';

export interface IMensaje {
  chat: mongoose.Types.ObjectId | string;
  sender: mongoose.Types.ObjectId | string;
  content: string;
  timestamp: Date;
}

export interface IMensajeModel extends IMensaje, Document {}

const MensajeSchema: Schema = new Schema(
  {
    chat: { type: Schema.Types.ObjectId, required: true, ref: 'Chat' },
    sender: { type: Schema.Types.ObjectId, required: true, ref: 'Usuario' },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

export default mongoose.model<IMensajeModel>('Mensaje', MensajeSchema);
