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
  thumnailUrl: string;

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
  email: string;
  
  @Expose()
  phoneNumber: string;

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
