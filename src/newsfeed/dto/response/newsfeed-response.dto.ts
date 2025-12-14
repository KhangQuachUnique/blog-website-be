// src/newsfeed/dto/response/newsfeed-response.dto.ts
import { Type } from 'class-transformer';

export class AuthorDto {
  id: number;
  username?: string;
  avatarUrl?: string | null;
}

export class CommunityDto {
  id: number;
  name: string;
  thumbnailUrl?: string | null;
}

export class NewsfeedItemDto {
  id: number;
  title: string;
  shortDescription?: string | null;
  thumbnailUrl?: string | null;
  isPublic: boolean = true;
  status: string = 'ACTIVE';
  type: string = 'PERSONAL';
  upVotes: number;
  downVotes: number;
  createdAt: string;
  @Type(() => AuthorDto)
  author: AuthorDto;
  community?: CommunityDto | null;
  hashtags: { id: number; name: string }[] = [];
  final_score: number;
  isViewed: boolean = false;
  totalReacts: number = 0;
  totalComments: number = 0;

  // Repost support
  originalPostId?: number | null;
  originalPost?: NewsfeedItemDto | null;
  originalPostPreview?: { id: number; title: string; thumbnailUrl?: string | null; author: AuthorDto; hashtags?: { id: number; name: string }[]; createdAt: string } | null;
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
