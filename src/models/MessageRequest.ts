import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageRequest {
  requester: mongoose.Types.ObjectId | string;
  seller: mongoose.Types.ObjectId | string;
  book: mongoose.Types.ObjectId | string;
  status: 'pending' | 'accepted' | 'denied';
  initialMessage?: string;
  requesterDismissed?: boolean;
  sellerDismissed?: boolean;
}

export interface IMessageRequestModel extends IMessageRequest, Document {}

const MessageRequestSchema: Schema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, required: true, ref: 'Usuario' },
    seller: { type: Schema.Types.ObjectId, required: true, ref: 'Usuario' },
    book: { type: Schema.Types.ObjectId, required: true, ref: 'Libro' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'denied'],
      default: 'pending',
      required: true,
    },
    initialMessage: { type: String, required: false },
    requesterDismissed: { type: Boolean, default: false },
    sellerDismissed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model<IMessageRequestModel>('MessageRequest', MessageRequestSchema);
