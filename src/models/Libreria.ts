import mongoose, { Document, Schema } from 'mongoose';

export interface ILibreria {
  name: string;
  address: string;
  IsDeleted?: boolean; // Campo para soft delete
}

export interface ILibreriaModel extends ILibreria, Document {}

const LibreriaSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    IsDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

LibreriaSchema.index({ name: 'text', address: 'text' });

export default mongoose.model<ILibreriaModel>('Libreria', LibreriaSchema);
