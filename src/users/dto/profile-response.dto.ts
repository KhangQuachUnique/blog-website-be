import { Exclude, Expose, Type } from 'class-transformer';
import { EGender } from '../enums/gender.enum';

class CommunityDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  thumbnailUrl: string;
}

class BlogPostDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  thumbnailUrl: string;

  @Expose()
  isPublic: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  upVotes: number;

  @Expose()
  downVotes: number;
}

export class ProfileResponseDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  email?: string; // Optional: chỉ hiện nếu user cho phép
  
  @Expose()
  phoneNumber?: string; // Optional: chỉ hiện nếu user cho phép

  @Expose()
  bio?: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  dob?: Date;

  @Expose()
  gender?: EGender;

  @Expose()
  isPrivate: boolean;

  @Expose()
  showEmail: boolean; // Cài đặt hiển thị email công khai

  @Expose()
  showPhoneNumber: boolean; // Cài đặt hiển thị số điện thoại công khai

  @Expose()
  joinAt: Date;

  @Expose()
  @Type(() => CommunityDto)
  communities: CommunityDto[];

  @Expose()
  followersCount: number;

  @Expose()
  followingCount: number;

  @Expose()
  isFollowing?: boolean; // Chỉ hiện khi có viewer (không phải chính mình)

  @Expose()
  @Type(() => BlogPostDto)
  posts: BlogPostDto[];

  @Exclude()
  password: string;

  @Exclude()
  googleId: string;
}
