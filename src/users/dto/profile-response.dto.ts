import { Exclude, Expose, Type } from 'class-transformer';
import { EGender } from '../enums/gender.enum';
import { PostResponseDto } from 'src/blog-posts/dto/response/blog-post-response.dto';
import { CommunityResponseDto } from 'src/communities/dto/response/my-community-response.dto';

export class ProfileResponseDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  email?: string;

  @Expose()
  phoneNumber?: string;

  @Expose()
  bio?: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  coverImageUrl?: string;

  @Expose()
  dob?: Date;

  @Expose()
  gender?: EGender;

  @Expose()
  isPrivate: boolean;

  @Expose()
  showEmail: boolean;

  @Expose()
  showPhoneNumber: boolean;

  @Expose()
  joinAt: Date;

  @Expose()
  @Type(() => CommunityResponseDto)
  communities: CommunityResponseDto[];

  @Expose()
  followersCount: number;

  @Expose()
  followingCount: number;

  @Expose()
  isFollowing?: boolean;

  @Expose()
  @Type(() => PostResponseDto)
  posts: PostResponseDto[];

  @Exclude()
  password: string;

  @Exclude()
  googleId: string;
}
