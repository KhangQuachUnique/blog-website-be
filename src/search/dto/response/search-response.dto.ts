import { PostResponseDto } from '../../../blog-posts/dto/response/blog-post-response.dto';
import { UserSearchDto } from './user-search.dto';
import { CommunitySearchDto } from './community-search.dto';
import { Expose, Type } from 'class-transformer';

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
  @Type(() => CommunitySearchDto)
  communities?: CommunitySearchDto[];

  @Expose()
  @Type(() => SearchPaginationDto)
  pagination?: SearchPaginationDto;
}
