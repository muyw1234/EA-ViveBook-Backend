import mongoose, { Document, Schema } from 'mongoose';

export interface IChat {
  participants: Array<mongoose.Types.ObjectId | string>;
  libro?: mongoose.Types.ObjectId | string;
}

export interface IChatModel extends IChat, Document {}

const ChatSchema: Schema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, required: true, ref: 'Usuario' }],
    libro: { type: Schema.Types.ObjectId, required: false, ref: 'Libro' },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model<IChatModel>('Chat', ChatSchema);
