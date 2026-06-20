import { NextFunction, Request, Response } from 'express';
import ImageService from '../services/Image';
import Logging from '../library/Logging';
import { sendError, sendSuccess } from '../library/ApiResponse';

async function getToken(req: Request, res: Response, next: NextFunction) {
  try {
    // const timestamp = req.params.timestamp;
    const service = ImageService.Instance;

    return res.status(200).json({ token: service.getToken() });
  } catch (error) {
    Logging.error(error);
    return res.status(403).json({ message: error });
  }
}

async function uploadRemoteImage(req: Request, res: Response, next: NextFunction) {
  const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : '';

  if (!imageUrl) {
    return sendError(res, 'imageUrl es obligatorio', 'Bad Request', 400);
  }

  try {
    const parsedUrl = new URL(imageUrl);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return sendError(res, 'imageUrl debe ser una URL HTTP o HTTPS', 'Bad Request', 400);
    }

    const service = ImageService.Instance;
    const uploadResult = await service.uploadRemoteImage(imageUrl);

    return sendSuccess(
      res,
      {
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      },
      'Imagen remota subida a Cloudinary',
      201,
    );
  } catch (error) {
    Logging.error(error);
    const cloudinaryStatus =
      typeof error === 'object' &&
      error !== null &&
      'http_code' in error &&
      typeof (error as { http_code?: unknown }).http_code === 'number'
        ? (error as { http_code: number }).http_code
        : undefined;

    return sendError(
      res,
      error,
      'No se pudo subir la imagen remota a Cloudinary',
      cloudinaryStatus,
    );
  }
}

export default { getToken, uploadRemoteImage };
