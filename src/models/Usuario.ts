import mongoose, { Document, Schema } from 'mongoose';

export interface IUsuario {
    name: string;
    email: string;
    password: string;
    IsDeleted?: boolean;
}

export interface IUsuarioModel extends IUsuario, Document {}

const UsuarioSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        IsDeleted: { type: Boolean, default: false }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model<IUsuarioModel>('Usuario', UsuarioSchema);
