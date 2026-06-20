import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { config } from '../config/config';

export interface Token {
  timestamp: string;
  signature: string;
}

export default class ImageService {
  private static _instance: ImageService;

  private constructor() {
    //...
    cloudinary.config({
      cloud_name: config.cloudinary.name,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.secret,
    });
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  // public upload(callback: UploadResponseCallback): UploadStream {
  //     return cloudinary.uploader.upload_stream({ folder: 'vivebook' }, callback);
  // }

  public getToken(): Token {
    // const date: number = Date.now();
    const timestamp: number = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp: timestamp },
      config.cloudinary.secret,
    );
    return { timestamp: timestamp.toString(), signature: signature };
  }

  public async uploadRemoteImage(imageUrl: string): Promise<UploadApiResponse> {
    return await cloudinary.uploader.upload(imageUrl, {
      resource_type: 'image',
    });
  }
}
