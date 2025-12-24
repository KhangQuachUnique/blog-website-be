import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { UploadFileServiceS3 } from './upload-file.service';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Files')
@Controller('files')
export class UploadFileController {
  constructor(private readonly uploadFileServiceS3: UploadFileServiceS3) {}

  @Post('upload/image')
  @ApiOperation({ summary: 'Upload ảnh lên S3 (chỉ chấp nhận jpg, jpeg, png, gif, webp)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh cần upload (jpg, jpeg, png, gif, webp - tối đa 5MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Upload ảnh thành công, trả về URL của ảnh',
    type: String,
  })
  @ApiResponse({
    status: 400,
    description: 'File không hợp lệ hoặc vượt quá kích thước cho phép',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<string> {
    return this.uploadFileServiceS3.uploadImageToBucket(file);
  }

  @Post('upload/images')
  @ApiOperation({ summary: 'Upload nhiều ảnh lên S3 (chỉ chấp nhận jpg, jpeg, png, gif, webp)' })
  @ApiResponse({
    status: 201,
    description: 'Upload ảnh thành công, trả về danh sách keys và URLs',
  })
  @ApiResponse({
    status: 400,
    description: 'File không hợp lệ hoặc vượt quá kích thước cho phép',
  })
  @UseInterceptors(AnyFilesInterceptor())
  async uploadImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB per file
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|gif|webp)$/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
    @Body('keys') keys: string | string[],
  ): Promise<Record<string, string>> {
    return this.uploadFileServiceS3.uploadImagesToBucket(files, keys);
  }
}
