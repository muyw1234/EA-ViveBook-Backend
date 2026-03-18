import { required, Types } from 'joi';
import mongoose, { Document, Model, mongo, Mongoose, Schema } from 'mongoose';

export enum PostStatus {
    'VENTA',
    'ALQUILER',
    'NO_DISPONIBLE'
}

export interface IPost extends Document {
    description: string;
    status: string; //PostStatus; // nunca he probado a hacer un enum en typescript
    imageUrl?: string; // opcional, si no sube nada entonces le ponemos un imagen default
    IsDeleted?: boolean;
    ownerId: mongoose.Types.ObjectId | string;
    bookId: mongoose.Types.ObjectId | string;
}

const PostSchema = new Schema(
    {
        description: { type: String, default: '' },
        status: { type: String, required: true, enum: ['VENTA', 'ALQUILER', 'NO_DISPONIBLE'] },
        imageUrl: { type: String },
        IsDeleted: { type: Boolean, default: false },
        ownerId: { type: Schema.Types.ObjectId, required: true, ref: 'Usuario' },
        bookId: { type: Schema.Types.ObjectId, required: true, ref: 'Libro' }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model<IPost>('Post', PostSchema);
