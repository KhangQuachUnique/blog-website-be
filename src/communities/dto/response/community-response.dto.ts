import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ECommunityRole } from '../../enums/community-role.enum';

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
  @ApiProperty({
    example: false,
    required: false,
    description: 'Bật duyệt bài viết trước khi hiển thị',
  })
  requirePostApproval?: boolean;

  @Expose()
  @ApiProperty({
    example: false,
    required: false,
    description: 'Bật duyệt thành viên trước khi tham gia',
  })
  requireMemberApproval?: boolean;

  @Expose()
  @ApiProperty({
    example: false,
    required: false,
    description: 'User hiện tại có đang bị cấm trong cộng đồng không',
  })
  isBanned?: boolean;

  @Expose()
  @ApiProperty({ example: 150, description: 'Số lượng thành viên trong cộng đồng' })
  memberCount: number;

  @Expose()
  @ApiProperty({ enum: ECommunityRole, description: 'Vai trò của user hiện tại' })
  role: ECommunityRole | 'NONE';

  @Expose()
  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Community Creation Date',
    required: false,
  })
  createdAt?: Date;
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
