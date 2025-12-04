import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EBlogPostStatus } from '../enums/blog-post-status.enum';

export class UpdateBlogStatusDto {
  @ApiProperty({
    enum: EBlogPostStatus,
    example: EBlogPostStatus.ACTIVE,
    description: 'Trạng thái bài viết',
  })
  @IsNotEmpty()
  @IsEnum(EBlogPostStatus)
  status: EBlogPostStatus;
}
