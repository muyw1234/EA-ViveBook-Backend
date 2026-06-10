import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';

export interface IUsuario {
  name: string;
  email: string;
  password?: string;
  authProvider?: 'local' | 'google' | 'apple';
  googleId?: string;
  appleId?: string;
  avatar?: string;
  rol: 'Admin' | 'User';
  libros: mongoose.Types.ObjectId[] | string[]; // Es un array porque claro, un usuario puede tener mas de un libro
  boughtLibros: mongoose.Types.ObjectId[] | string[];
  rentedLibros: mongoose.Types.ObjectId[] | string[];
  favoriteAuthors?: string[];
  favoriteBooks?: string[];
  favoriteCategories?: string[];
  followingUsers?: mongoose.Types.ObjectId[] | string[];
  favoritos: mongoose.Types.ObjectId[] | string[];
  description?: string;
  IsDeleted?: boolean;
  hasSeenTutorial?: boolean;
  encryptPassword(password: string): Promise<string>;
  validatePassword(password: string): Promise<boolean>;
}

export interface IUsuarioModel extends IUsuario, Document {}

const UsuarioSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function (this: any) {
        return this.authProvider === 'local' || !this.authProvider;
      },
    },
    authProvider: { type: String, enum: ['local', 'google', 'apple'], default: 'local' },
    googleId: { type: String, required: false },
    appleId: { type: String, required: false },
    avatar: { type: String, required: false },
    rol: { type: String, enum: ['Admin', 'User'], default: 'User' },
    libros: [{ type: Schema.Types.ObjectId, required: false, ref: 'Libro' }],
    boughtLibros: [{ type: Schema.Types.ObjectId, required: false, ref: 'Libro' }],
    rentedLibros: [{ type: Schema.Types.ObjectId, required: false, ref: 'Libro' }],
    favoriteAuthors: [{ type: String, required: false }],
    favoriteBooks: [{ type: String, required: false }],
    favoriteCategories: [{ type: String, required: false }],
    followingUsers: [{ type: Schema.Types.ObjectId, required: false, ref: 'Usuario' }],
    favoritos: { type: [{ type: Schema.Types.ObjectId, ref: 'Libro' }], default: [] },
    description: { type: String, required: false, default: '' },
    IsDeleted: { type: Boolean, default: false },
    hasSeenTutorial: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Esto hashea solamenet en la ruta de sign up.
UsuarioSchema.methods.encryptPassword = async function (password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10); // el algoritmo se aplica 10 veces
  return bcrypt.hash(password, salt);
};

// Esto hashea la contraseña independientemente de que ruta tomas, pero con lo anterior ya nos vale.
// UsuarioSchema.pre<IUsuarioModel>('save', async function (next) {
//     if (!this.isModified('password')) {
//         return next();
//     }

//     try {
//         const salt = await bcrypt.genSalt(10);
//         this.password = await bcrypt.hash(this.password, salt);
//         next();
//     } catch (error: any) {
//         next(error);
//     }
// });

UsuarioSchema.methods.validatePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

UsuarioSchema.index({ name: 'text', email: 'text' });

export default mongoose.model<IUsuarioModel>('Usuario', UsuarioSchema);
