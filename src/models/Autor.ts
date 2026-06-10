import mongoose, { Document, Schema } from 'mongoose';

export interface IAutor {
  fullName: string;
  IsDeleted?: boolean;
}

export interface IAutorModel extends IAutor, Document {}

const AutorSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true },
    IsDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model<IAutorModel>('Autor', AutorSchema);
