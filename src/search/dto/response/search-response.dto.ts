import { PostResponseDto } from '../../../blog-posts/dto/response/blog-post-response.dto';
import { User } from '../../../users/entities/user.entity'; // Hoặc UserResponseDto nếu có
import { Community } from '../../../communities/entities/community.entity';
import { Expose } from 'class-transformer';

export class SearchMetaDto {
  @Expose()
  postsTotal?: number;

  @Expose()
  postsHasMore?: boolean; // Cờ này cho tab "Bài viết" và trang chủ

  @Expose()
  usersTotal?: number;
  
  @Expose()
  usersHasMore?: boolean; // [THÊM MỚI] Cờ này cho tab "Người dùng"

  @Expose()
  communitiesTotal?: number;

  @Expose()
  communitiesHasMore?: boolean; // [THÊM MỚI] Cờ này cho tab "Cộng đồng"
}

export class SearchResponseDto {
  @Expose()
  posts?: PostResponseDto[];

  @Expose()
  // Nếu bạn chưa có UserResponseDto, có thể giữ nguyên User[] 
  // nhưng nhớ kiểm tra kỹ Entity User đã @Exclude password chưa nhé.
  users?: User[]; 

  @Expose()
  communities?: Community[];

  @Expose()
  meta?: SearchMetaDto;
}