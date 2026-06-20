import axios from 'axios';
import mongoose from 'mongoose';
import Usuario, { IUsuarioModel } from '../models/Usuario';
import Logging from '../library/Logging';

interface SendNotificationArgs {
  recipient: string | mongoose.Types.ObjectId | IUsuarioModel;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const sendPushNotification = async ({
  recipient,
  title,
  body,
  data,
}: SendNotificationArgs): Promise<boolean> => {
  try {
    let user: IUsuarioModel | null = null;

    if (typeof recipient === 'string' || recipient instanceof mongoose.Types.ObjectId) {
      user = await Usuario.findById(recipient);
    } else {
      user = recipient as IUsuarioModel;
    }

    if (!user) {
      Logging.warning(`No se pudo enviar notificación: el destinatario no existe.`);
      return false;
    }

    const token = user.expoPushToken;
    if (!token) {
      Logging.info(
        `No se envía notificación push: el usuario ${user.name} (${user._id}) no tiene token push registrado.`,
      );
      return false;
    }

    // Comprobamos formato básico del token de Expo
    if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
      Logging.warning(`Token push inválido detectado para el usuario ${user.name}: ${token}`);
      return false;
    }

    Logging.info(`Preparando envío de notificación push a ${user.name}: "${title}" - "${body}"`);

    const payload = {
      to: token,
      sound: 'default',
      title,
      body,
      data,
    };

    const response = await axios.post('https://exp.host/--/api/v2/push/send', payload, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const responseData = response.data;
      if (responseData.data && responseData.data.status === 'error') {
        Logging.error(`Error reportado por la API de Expo: ${JSON.stringify(responseData.data)}`);
        return false;
      }
      Logging.info(`Notificación push enviada con éxito a ${user.name}`);
      return true;
    } else {
      Logging.error(`Error al llamar a la API de Expo. HTTP Status: ${response.status}`);
      return false;
    }
  } catch (error: any) {
    // Si falla el envío de la notificación, se registra el error pero no interrumpe la acción principal.
    Logging.error(`Fallo al procesar/enviar notificación push: ${error.message}`);
    return false;
  }
};
