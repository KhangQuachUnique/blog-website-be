import { Expose } from 'class-transformer';

/**
 * DTO for user search results
 * Contains only public information safe to expose in search
 */
export class UserSearchDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  bio?: string;
}
