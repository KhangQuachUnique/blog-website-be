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
  BadRequestException,
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Danh sách file ảnh cần upload',
        },
        keys: {
          type: 'string',
          description:
            'JSON array hoặc comma-separated string các keys tương ứng với files. VD: ["avatar","cover"] hoặc "avatar,cover"',
        },
      },
      required: ['files', 'keys'],
    },
  })
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
    @Body('keys') keysRaw: string | string[],
  ): Promise<Record<string, string>> {
    // Parse keys từ string hoặc JSON string
    let keys: string[];

    if (Array.isArray(keysRaw)) {
      // Trường hợp đã là array (ít khi xảy ra với form-data)
      keys = keysRaw;
    } else if (typeof keysRaw === 'string') {
      // Trường hợp là string (phổ biến với form-data)
      try {
        // Thử parse JSON: ["avatar","cover"]
        const parsed: string[] = JSON.parse(keysRaw) as string[];
        if (Array.isArray(parsed)) {
          keys = parsed;
        } else {
          throw new Error('Parsed value is not an array');
        }
      } catch {
        // Không phải JSON, thử split bằng dấu phấy: "avatar,cover"
        keys = keysRaw
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
      }
    } else {
      throw new BadRequestException('keys must be a string or array');
    }

    // Validation
    if (!keys || keys.length === 0) {
      throw new BadRequestException('keys cannot be empty');
    }

    if (keys.length !== files.length) {
      throw new BadRequestException(
        `Number of keys (${keys.length}) must match number of files (${files.length})`,
      );
    }

    // Kiểm tra keys có hợp lệ không (không rỗng, không chỉ là whitespace)
    for (let i = 0; i < keys.length; i++) {
      if (!keys[i] || keys[i].trim().length === 0) {
        throw new BadRequestException(`Key at index ${i} is empty or invalid`);
      }
    }

    return this.uploadFileServiceS3.uploadImagesToBucket(files, keys);
  }
}
