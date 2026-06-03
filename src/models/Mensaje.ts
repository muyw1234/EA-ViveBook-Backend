import mongoose, { Document, Schema } from 'mongoose';

export interface IMensaje {
    chat: mongoose.Types.ObjectId | string;
    sender: mongoose.Types.ObjectId | string;
    content: string;
    timestamp: Date;
    category?: 'general' | 'reservation';
    relatedReservationId?: mongoose.Types.ObjectId | string;
    readBy?: Array<mongoose.Types.ObjectId | string>;
    deletedBy?: Array<mongoose.Types.ObjectId | string>;
}

export interface IMensajeModel extends IMensaje, Document { }

const MensajeSchema: Schema = new Schema(
    {
        chat: { type: Schema.Types.ObjectId, required: true, ref: 'Chat' },
        sender: { type: Schema.Types.ObjectId, required: true, ref: 'Usuario' },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        category: { type: String, enum: ['general', 'reservation'], default: 'general', required: true },
        relatedReservationId: { type: Schema.Types.ObjectId, ref: 'Reserva', required: false },
        readBy: [{ type: Schema.Types.ObjectId, ref: 'Usuario', default: [] }],
        deletedBy: [{ type: Schema.Types.ObjectId, ref: 'Usuario', default: [] }]
    },
    {
        versionKey: false
    }
);

export default mongoose.model<IMensajeModel>('Mensaje', MensajeSchema);
