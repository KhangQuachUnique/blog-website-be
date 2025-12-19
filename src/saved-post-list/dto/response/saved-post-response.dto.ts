import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * DTO cho author info trong saved post response
 */
export class SavedPostAuthorDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'johndoe' })
  @Expose()
  username: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @Expose()
  avatarUrl?: string;
}

/**
 * DTO cho post summary trong saved list
 */
export class SavedPostItemDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: '2024-12-18T10:30:00Z' })
  @Expose()
  savedAt: Date;

  @ApiProperty({ example: 123, description: 'Post ID' })
  @Expose()
  postId: number;

  @ApiPropertyOptional({ example: 'My awesome blog post' })
  @Expose()
  postTitle?: string;

  @ApiPropertyOptional({ example: 'This is the content preview...' })
  @Expose()
  postPreview?: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
  @Expose()
  postThumbnail?: string;

  @ApiProperty({ type: SavedPostAuthorDto })
  @Expose()
  @Type(() => SavedPostAuthorDto)
  author: SavedPostAuthorDto;
}

/**
 * Response DTO cho danh sách saved posts với pagination
 */
export class SavedPostListResponseDto {
  @ApiProperty({ type: [SavedPostItemDto] })
  @Expose()
  @Type(() => SavedPostItemDto)
  items: SavedPostItemDto[];

  @ApiProperty({ example: 50 })
  @Expose()
  total: number;

  @ApiProperty({ example: 1 })
  @Expose()
  page: number;

  @ApiProperty({ example: 20 })
  @Expose()
  limit: number;

  @ApiProperty({ example: 3 })
  @Expose()
  totalPages: number;
}

/**
 * Response sau khi toggle save
 */
export class ToggleSavedPostResponseDto {
  @ApiProperty({ example: 'Post saved successfully' })
  @Expose()
  message: string;

  @ApiProperty({ example: true, description: 'Trạng thái sau khi toggle' })
  @Expose()
  isSaved: boolean;
}

/**
 * Response check if saved
 */
export class CheckSavedResponseDto {
  @ApiProperty({ example: true })
  @Expose()
  isSaved: boolean;
}

/**
 * Batch check saved response - Map postId -> isSaved
 */
export class BatchCheckSavedResponseDto {
  @ApiProperty({ 
    example: { '1': true, '2': false, '3': true },
    description: 'Map của postId -> isSaved status'
  })
  @Expose()
  savedMap: Record<number, boolean>;
}
