import { ApiProperty } from '@nestjs/swagger';
import { ECommunityRole } from '../../enums/community-role.enum';

export class CommunityResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  thumbnailUrl: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty({ example: 123, description: 'Số lượng thành viên trong cộng đồng' })
  memberCount: number;

  @ApiProperty({ enum: ECommunityRole, description: 'Vai trò của user hiện tại' })
  role: ECommunityRole | 'NONE';
}
