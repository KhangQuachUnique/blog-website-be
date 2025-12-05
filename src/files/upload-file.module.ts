import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadFileController } from './upload-file.controller';
import { UploadFileServiceS3 } from './upload-file.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [UploadFileController],
  providers: [UploadFileServiceS3],
  exports: [UploadFileServiceS3],
})
export class UploadFileModule {}
