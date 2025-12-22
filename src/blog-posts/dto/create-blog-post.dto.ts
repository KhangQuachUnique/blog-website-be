import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BlogPostType } from '../enums/blog-post-type.enum';
import { CreateBlockDto } from 'src/blocks/dto/create-block.dto';

export class CreateBlogPostDto {
  @ApiProperty({
    description: 'Tiêu đề bài viết',
    example: 'Hướng dẫn NestJS cơ bản',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề bài viết là bắt buộc' })
  @MaxLength(255, { message: 'Tiêu đề bài viết không được vượt quá 255 ký tự' })
  title: string;

  @ApiProperty({
    description: 'Mô tả ngắn của bài viết',
    example: 'Đây là mô tả ngắn của bài viết đầu tiên của tôi.',
  })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiPropertyOptional({
    description: 'URL ảnh thumbnail',
    example: 'https://example.com/thumbnail.jpg',
  })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: 'Bài viết công khai hay riêng tư',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = true;

  @ApiProperty({
    description: 'Loại bài viết',
    enum: BlogPostType,
    example: BlogPostType.PERSONAL,
  })
  @IsEnum(BlogPostType, {
    message: 'Post type must be PERSONAL, COMMUNITY, or REPOST',
  })
  @IsNotEmpty()
  type: BlogPostType;

  @ApiProperty({
    description: 'ID của tác giả',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty({ message: 'ID của tác giả là bắt buộc' })
  authorId: number;

  @ApiPropertyOptional({
    description: 'ID community (bắt buộc nếu type = COMMUNITY)',
    example: 1,
  })
  @ValidateIf((o: CreateBlogPostDto) => o.type === BlogPostType.COMMUNITY)
  @IsInt({ message: 'ID community phải là một số' })
  @IsNotEmpty({ message: 'ID community là bắt buộc đối với bài viết cộng đồng' })
  communityId?: number;

  @ApiPropertyOptional({
    description: 'ID bài viết gốc (bắt buộc nếu type = REPOST)',
    example: 1,
  })
  @ValidateIf((o: CreateBlogPostDto) => o.type === BlogPostType.REPOST)
  @IsInt({ message: 'Original post ID must be a number' })
  @IsNotEmpty({ message: 'Original post ID is required for reposts' })
  originalPostId?: number;

  @ApiPropertyOptional({
    description: 'Danh sách blocks nội dung',
    type: [CreateBlockDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBlockDto)
  @IsOptional()
  blocks?: CreateBlockDto[];

  @ApiPropertyOptional({
    description: 'Danh sách hashtags',
    example: ['nestjs', 'typescript', 'backend'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];
}
