import mongoose, { Document, Schema } from 'mongoose';

export interface IChat {
  participants: Array<mongoose.Types.ObjectId | string>;
  libro?: mongoose.Types.ObjectId | string;
  evento?: mongoose.Types.ObjectId | string;
  title?: string;
}

export interface IChatModel extends IChat, Document {}

const ChatSchema: Schema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, required: true, ref: 'Usuario' }],
    libro: { type: Schema.Types.ObjectId, required: false, ref: 'Libro' },
    evento: { type: Schema.Types.ObjectId, required: false, ref: 'Evento' },
    title: { type: String, required: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model<IChatModel>('Chat', ChatSchema);
