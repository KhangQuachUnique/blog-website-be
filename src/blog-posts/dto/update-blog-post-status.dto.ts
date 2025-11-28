import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EBlogPostStatus } from '../enums/blog-post-status.enum';

export class UpdateBlogStatusDto {
  @ApiProperty({
    enum: EBlogPostStatus,
    enumName: 'EBlogPostStatus',
    example: EBlogPostStatus.ACTIVE,
  })
  @IsNotEmpty()
  @IsEnum(EBlogPostStatus, {
    message: 'Invalid status',
  })
  status: EBlogPostStatus;
}
