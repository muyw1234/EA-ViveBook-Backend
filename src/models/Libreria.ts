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
    isDeleted: { type: Boolean, default: false }, // Campo para soft delete
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model<ILibreriaModel>('Libreria', LibreriaSchema);
