// src/newsfeed/dto/response/newsfeed-response.dto.ts
import { Type } from 'class-transformer';
import { PostResponseDto } from '../../../blog-posts/dto/response/blog-post-response.dto';

export class NewsfeedItemDto extends PostResponseDto {
  // Extra newsfeed-specific fields
  final_score?: number;
  isViewed?: boolean;
  totalComments?: number;

  // Repost support (originalPost typed as PostResponseDto)
  originalPostId?: number | null;
  originalPost?: PostResponseDto | null;
  originalPostPreview?: { id: number; title: string; thumbnailUrl?: string | null; author: PostResponseDto['author']; hashtags?: { id: number; name: string }[]; createdAt: string } | null;
}

export class PaginationDto {
  hasMore: boolean;
  nextCursor?: string | null;
}

export class GetNewsfeedResponseDto {
  @Type(() => NewsfeedItemDto)
  items: NewsfeedItemDto[] = [];
  pagination: PaginationDto;
}
