import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CommunityResponseDto {
  @Expose()
  @ApiProperty({ example: 1, description: 'Community ID' })
  id: number;

  @Expose()
  @ApiProperty({ example: 'Tech Enthusiasts', description: 'Community Name' })
  name: string;

  @Expose()
  @ApiProperty({
    example: 'A community for technology lovers',
    description: 'Community Description',
  })
  description: string;

  @Expose()
  @ApiProperty({
    example: 'https://example.com/thumbnail.jpg',
    description: 'Community Thumbnail URL',
  })
  thumbnailUrl: string;

  @Expose()
  @ApiProperty({ example: true, description: 'Is the community public?' })
  isPublic: boolean;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Community Creation Date' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: 150, description: 'Number of community members' })
  memberCount?: number;
}

export class CommunitySettingResponseDto {
  @Expose()
  @ApiProperty({ example: 1, description: 'Community ID' })
  id: number;

  @Expose()
  @ApiProperty({ example: 'Tech Enthusiasts', description: 'Community Name' })
  name: string;

  @Expose()
  @ApiProperty({
    example: 'A community for technology lovers',
    description: 'Community Description',
  })
  description: string;

  @Expose()
  @ApiProperty({
    example: 'https://example.com/thumbnail.jpg',
    description: 'Community Thumbnail URL',
  })
  thumbnailUrl: string;

  @Expose()
  @ApiProperty({ example: true, description: 'Is the community public?' })
  isPublic: boolean;

  @Expose()
  @ApiProperty({ example: false, description: 'Does the community require post approval?' })
  requirePostApproval: boolean;

  @Expose()
  @ApiProperty({ example: false, description: 'Does the community require member approval?' })
  requireMemberApproval: boolean;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Community Creation Date' })
  createdAt: Date;
}
