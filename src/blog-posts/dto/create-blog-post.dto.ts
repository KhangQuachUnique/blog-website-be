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
import { Hashtag } from 'src/hashtags/entities/hashtag.entity';

export class CreateBlogPostDto {
  @ApiProperty({
    description: 'Tiêu đề bài viết',
    example: 'Hướng dẫn NestJS cơ bản',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(255, { message: 'Title must be at most 255 characters' })
  title: string;

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
  @IsNotEmpty({ message: 'Author ID is required' })
  authorId: number;

  @ApiPropertyOptional({
    description: 'ID community (bắt buộc nếu type = COMMUNITY)',
    example: 1,
  })
  @ValidateIf((o: CreateBlogPostDto) => o.type === BlogPostType.COMMUNITY)
  @IsInt({ message: 'Community ID must be a number' })
  @IsNotEmpty({ message: 'Community ID is required for community posts' })
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
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: Hashtag[];
}
