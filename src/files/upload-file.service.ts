import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, UploadedFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadFileServiceS3 {
  private readonly s3_client: S3Client;

  constructor(private readonly config: ConfigService) {
    this.s3_client = new S3Client({
      region: this.config.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadImageToBucket(@UploadedFile() file: Express.Multer.File): Promise<string> {
    const bucket_name = this.config.getOrThrow<string>('AWS_S3_BUCKET');
    const extension = file.originalname.split('.').pop() || 'jpg';
    const key = `images/${crypto.randomUUID()}.${extension}`;

    await this.s3_client.send(
      new PutObjectCommand({
        Bucket: bucket_name,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      }),
    );

    const url = `https://${bucket_name}.s3.amazonaws.com/${key}`;
    return url;
  }

  async uploadImagesToBucket(
    files: Express.Multer.File[],
    keys: string[],
  ): Promise<Record<string, string>> {
    const bucket_name = this.config.getOrThrow<string>('AWS_S3_BUCKET');
    const result: Record<string, string> = {};

    const uploadPromises = files.map((file, index) => {
      const key = keys[index];

      const s3Key = `images/${crypto.randomUUID()}_${key}`;
      return this.s3_client
        .send(
          new PutObjectCommand({
            Bucket: bucket_name,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ContentLength: file.size,
          }),
        )

        .then(() => {
          const url = `https://${bucket_name}.s3.amazonaws.com/${s3Key}`;
          result[key] = url;
        });
    });
    await Promise.all(uploadPromises);
    return result;
  }
}
