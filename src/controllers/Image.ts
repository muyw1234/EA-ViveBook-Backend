import { NextFunction, Request, Response } from 'express';
import ImageService from '../services/Image';
import Logging from '../library/Logging';

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

export default { getToken };
