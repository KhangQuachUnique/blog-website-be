import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateBlockDto } from 'src/blocks/dto/create-block.dto';
import { Hashtag } from 'src/hashtags/entities/hashtag.entity';

export class UpdateBlogPostDto {
  // Note: `id` and `type` are not expected to be updated via this DTO

  @ApiPropertyOptional({ example: 'Tiêu đề đã cập nhật' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Mô tả ngắn đã cập nhật' })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'https://example.com/new-thumbnail.jpg' })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ type: [CreateBlockDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBlockDto)
  @IsOptional()
  blocks?: CreateBlockDto[];

  @ApiPropertyOptional({ example: ['nestjs', 'updated'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];
}
