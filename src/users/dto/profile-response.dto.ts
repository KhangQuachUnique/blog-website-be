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
  bio: string;

  @Expose()
  avatarUrl: string;

  @Expose()
  dob: Date;

  @Expose()
  gender: EGender;

  @Expose()
  isPrivate: boolean;

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
  @Type(() => BlogPostDto)
  posts: BlogPostDto[];

  @Exclude()
  password: string;

  @Exclude()
  googleId: string;
}
