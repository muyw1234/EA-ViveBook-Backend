import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';

export interface IUsuario {
    name: string;
    email: string;
    password: string;
    libros: mongoose.Types.ObjectId[] | string[]; // Es un array porque claro, un usuario puede tener mas de un libro
    IsDeleted?: boolean;
    encryptPassword(password: string): Promise<string>;
    validatePassword(password: string): Promise<boolean>;
}

export interface IUsuarioModel extends IUsuario, Document {}

const UsuarioSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        libros: [{ type: Schema.Types.ObjectId, required: false, ref: 'Libro' }],
        IsDeleted: { type: Boolean, default: false }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

UsuarioSchema.methods.encryptPassaword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10); // el algoritmo se aplica 10 veces
    return bcrypt.hash(password, salt);
};

UsuarioSchema.methods.validatePassword = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

export default mongoose.model<IUsuarioModel>('Usuario', UsuarioSchema);
