import { Expose } from 'class-transformer';

/**
 * DTO for community search results
 * Contains only public information for search listing
 */
export class CommunitySearchDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  thumbnailUrl?: string;

  @Expose()
  isPublic: boolean;

  @Expose()
  memberCount: number;

  @Expose()
  createdAt: Date;
}
