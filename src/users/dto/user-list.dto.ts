import { Expose } from 'class-transformer';

export class UserListDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  bio?: string;

  @Expose()
  isFollowing?: boolean; 
}
