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
  ): Promise<{ keys: string[]; urls: string[] }> {
    const bucket_name = this.config.getOrThrow<string>('AWS_S3_BUCKET');
    const uploadPromises = files.map((file, index) => {
      const key = `images/${crypto.randomUUID()}.${keys[index]}`;
      return this.s3_client
        .send(
          new PutObjectCommand({
            Bucket: bucket_name,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ContentLength: file.size,
          }),
        )
        .then(() => `https://${bucket_name}.s3.amazonaws.com/${key}`);
    });
    const urls = await Promise.all(uploadPromises);
    return { keys, urls };
  }
}
