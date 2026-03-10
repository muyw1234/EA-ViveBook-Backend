import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOrganizacion {
    name: string;
    // Campo virtual (no se almacena en BD, se calcula al hacer populate)
    // Contiene los usuarios relacionados con esta organización
    usuarios?: Array<import('mongoose').Types.ObjectId> | any[];
}

export interface IOrganizacionModel extends IOrganizacion, Document {}

const OrganizacionSchema: Schema = new Schema(
    {
        name: { type: String, required: true }
    },
    {
        versionKey: false,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual: busca usuarios sin guardar en BD (Opción B)
OrganizacionSchema.virtual('usuarios', {
    ref: 'Usuario',              // Referencia a la colección Usuario
    localField: '_id',           // ID de esta Organización
    foreignField: 'organizacion', // Campo en Usuario que me referencia
    justOne: false               // Array de usuarios
});

/**
 * MIDDLEWARE: Pre-delete con borrado en cascada
 * 
 * Si se elimina una organización:
 * 1. Se ejecuta este hook ANTES de eliminarla
 * 2. Busca todos los usuarios de esa organización
 * 3. Los elimina también (borrado en cascada)
 * 4. Después elimina la organización
 * 
 * Esto mantiene la integridad referencial: no hay usuarios huérfanos
 */
OrganizacionSchema.pre('findOneAndDelete', async function (next) {
    // this.getQuery()._id obtiene el ID de la organización que se va a borrar
    const organizacionId = this.getQuery()._id;
    
    // Elimina todos los usuarios que pertenecen a esta organización
    await mongoose.model('Usuario').deleteMany({ organizacion: organizacionId });
    
    // Continúa con el próximo middleware (la eliminación de la organización)
    next();
});

export default mongoose.model<IOrganizacionModel>('Organizacion', OrganizacionSchema);
