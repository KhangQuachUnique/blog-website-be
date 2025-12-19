import { PostResponseDto } from '../../../blog-posts/dto/response/blog-post-response.dto';
import { User } from '../../../users/entities/user.entity';
import { Community } from '../../../communities/entities/community.entity';
import { Expose } from 'class-transformer';

export class SearchResponseDto {
  @Expose()
  posts?: PostResponseDto[];

  @Expose()
  users?: User[];

  @Expose()
  communities?: Community[];
}
