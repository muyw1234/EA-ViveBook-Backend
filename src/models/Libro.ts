import mongoose, { Document, Schema } from 'mongoose';

export interface ILibro {
  isbn: string;
  title: string;
  authors?: mongoose.Types.ObjectId[] | string[];
  type: 'VENTA' | 'ALQUILER';
  precio: number;
  estado: string;
  owner?: mongoose.Types.ObjectId | string;
  IsDeleted?: boolean;
}

export interface ILibroModel extends ILibro, Document {}

const LibroSchema: Schema = new Schema(
  {
    isbn: { type: String, required: true, index: true },
    title: { type: String, required: true },
    authors: [{ type: Schema.Types.ObjectId, required: false, ref: 'Autor' }],
    type: { type: String, enum: ['VENTA', 'ALQUILER'], required: true },
    precio: { type: Number, required: true },
    estado: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'Usuario', required: false },
    IsDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

LibroSchema.index({ title: 'text' });

export default mongoose.model<ILibroModel>('Libro', LibroSchema);
