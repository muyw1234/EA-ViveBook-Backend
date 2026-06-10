import mongoose, { Document, Schema } from 'mongoose';

export interface ILibro {
  isbn: string;
  title: string;
  authors?: mongoose.Types.ObjectId[] | String[];
  autor?: string;
  categoria?: string;
  type: 'VENTA' | 'ALQUILER';
  precio: number;
  estado: string;
  owner?: mongoose.Types.ObjectId | string;
  IsDeleted?: boolean;
  rentalStartDate?: Date;
  rentalEndDate?: Date;
  imageUrl?: string;
  isReserved?: boolean;
  reservedBy?: mongoose.Types.ObjectId | string;
  reservationExpiry?: Date;
}

export interface ILibroModel extends ILibro, Document {}

const LibroSchema: Schema = new Schema(
  {
    isbn: { type: String, required: true, index: true },
    title: { type: String, required: true },
    autor: { type: String, required: false },
    categoria: { type: String, required: false },
    authors: [{ type: Schema.Types.ObjectId, required: false, ref: 'Autor' }],
    type: { type: String, enum: ['VENTA', 'ALQUILER'], required: true },
    precio: { type: Number, required: true },
    estado: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'Usuario', required: false },
    IsDeleted: { type: Boolean, default: false },
    rentalStartDate: { type: Date, required: false },
    rentalEndDate: { type: Date, required: false },
    imageUrl: { type: String, required: false },
    isReserved: { type: Boolean, default: false },
    reservedBy: { type: Schema.Types.ObjectId, ref: 'Usuario', required: false },
    reservationExpiry: { type: Date, required: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

LibroSchema.index({ title: 'text', isbn: 'text', autor: 'text' });

export default mongoose.model<ILibroModel>('Libro', LibroSchema);
