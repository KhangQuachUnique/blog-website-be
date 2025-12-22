import { PostResponseDto } from '../../../blog-posts/dto/response/blog-post-response.dto';
import { User } from '../../../users/entities/user.entity'; // Hoặc UserResponseDto nếu có
import { Community } from '../../../communities/entities/community.entity';
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
  // Nếu bạn chưa có UserResponseDto, có thể giữ nguyên User[]
  // nhưng nhớ kiểm tra kỹ Entity User đã @Exclude password chưa nhé.
  users?: User[];

  @Expose()
  communities?: Community[];

  @Expose()
  @Type(() => SearchPaginationDto)
  pagination?: SearchPaginationDto;
}
