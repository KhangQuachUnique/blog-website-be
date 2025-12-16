// src/newsfeed/dto/response/newsfeed-response.dto.ts
import { Type } from 'class-transformer';
import { UserReactSummaryDto } from 'src/user-reacts/dto/response/user-react-summary.dto';

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
  thumbnailUrl?: string | null;
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
  reacts: UserReactSummaryDto;
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
