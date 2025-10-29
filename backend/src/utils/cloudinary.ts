import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

export async function uploadToCloudinary(
  file: Express.Multer.File | Buffer | { path: string },
  folder: string = 'cortexdesk',
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  } = {}
): Promise<CloudinaryUploadResult> {
  // If a disk path is provided (multer diskStorage), use direct upload
  if ((file as any).path) {
    const result = await cloudinary.uploader.upload((file as any).path, { folder, ...options } as any);
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadOptions: any = { folder, ...options };
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error('Upload failed: No result returned'));
      resolve({
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: result.resource_type,
      });
    });

    if (file instanceof Buffer) {
      uploadStream.end(file as Buffer);
    } else if ((file as any).buffer) {
      const buf = Buffer.isBuffer((file as any).buffer) ? (file as any).buffer as Buffer : Buffer.from((file as any).buffer);
      uploadStream.end(buf);
    } else {
      reject(new Error('Unsupported file input for Cloudinary upload'));
    }
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export default cloudinary;

