import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PostResponseDto } from 'src/blog-posts/dto/response/blog-post-response.dto';

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
 * Response DTO cho danh sách saved posts với pagination
 */
export class SavedPostListResponseDto {
  @ApiProperty({ type: [PostResponseDto] })
  @Expose()
  @Type(() => PostResponseDto)
  items: PostResponseDto[];

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
    description: 'Map của postId -> isSaved status',
  })
  @Expose()
  savedMap: Record<number, boolean>;
}
