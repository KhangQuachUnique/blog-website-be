import { PostResponseDto } from '../../../blog-posts/dto/response/blog-post-response.dto';
import { UserSearchDto } from './user-search.dto';
import { Expose, Type } from 'class-transformer';
import { CommunityResponseDto } from 'src/communities/dto/response/community-response.dto';

export class SearchPaginationDto {
  @Expose()
  hasMore: boolean;

  @Expose()
  nextCursor?: string | null;
}

export class SearchResponseDto {
  @Expose()
  @Type(() => PostResponseDto)
  posts?: PostResponseDto[];

  @Expose()
  @Type(() => UserSearchDto)
  users?: UserSearchDto[];

  @Expose()
  @Type(() => CommunityResponseDto)
  communities?: CommunityResponseDto[];

  @Expose()
  @Type(() => SearchPaginationDto)
  pagination?: SearchPaginationDto;
}
