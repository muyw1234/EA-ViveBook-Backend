import mongoose from 'mongoose';
import Chat from '../models/Chat';
import Logging from '../library/Logging';

export const ensureGlobalChat = async () => {
  try {
    let globalChat = await Chat.findOne({ participants: [] }); // O alguna marca especial
    // Mejor buscar por un campo que identifique el chat global
    // Como no tengo un campo 'name', usaré un ObjectId fijo o una marca

    // Vamos a ver si ya hay uno con un ID específico que usaremos siempre
    const GLOBAL_CHAT_ID = '000000000000000000000001';

    globalChat = await Chat.findById(GLOBAL_CHAT_ID);

    if (!globalChat) {
      globalChat = new Chat({
        _id: new mongoose.Types.ObjectId(GLOBAL_CHAT_ID),
        participants: [], // Vacío significa global para nosotros
      });
      await globalChat.save();
      Logging.info('Global Chat created');
    }
    return GLOBAL_CHAT_ID;
  } catch (error) {
    Logging.error(`Error ensuring global chat: ${error}`);
  }
};
