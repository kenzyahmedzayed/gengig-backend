import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, HttpCode, HttpStatus, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { cloudinary } from '../users/cloudinary.config';

@Controller('uploads')
export class UploadsController {
  @Post('image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'gengig/images' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      ).end(file.buffer);
    });

    return {
      url: (result as any).secure_url,
    };
  }
  // POST /uploads/file
@Post('file')
@HttpCode(HttpStatus.OK)
@UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'gengig/files',
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    ).end(file.buffer);
  });

  return {
    url: (result as any).secure_url,
    originalName: file.originalname,
    size: file.size,
    type: file.mimetype,
  };
}
}