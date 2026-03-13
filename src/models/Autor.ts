import mongoose, { Document, Schema } from 'mongoose';

export interface IAutor {
    fullName: string;
}

export interface IAutorModel extends IAutor, Document {}

const AutorSchema: Schema = new Schema(
    {
        fullName: { type: String, required: true }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model<IAutorModel>('Autor', AutorSchema);