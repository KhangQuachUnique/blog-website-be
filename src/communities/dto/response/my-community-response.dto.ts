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

  // ✅ để optional vì list / detail thường không cần trả
  @ApiProperty({ example: false, required: false, description: 'Bật duyệt bài viết trước khi hiển thị' })
  requirePostApproval?: boolean;

  @ApiProperty({ example: false, required: false, description: 'Bật duyệt thành viên trước khi tham gia' })
  requireMemberApproval?: boolean;

  @ApiProperty({
    example: false,
    required: false,
    description: 'User hiện tại có đang bị cấm trong cộng đồng không',
  })
  isBanned?: boolean;

  @ApiProperty({ example: 123, description: 'Số lượng thành viên trong cộng đồng' })
  memberCount: number;

  @ApiProperty({ enum: ECommunityRole, description: 'Vai trò của user hiện tại' })
  role: ECommunityRole | 'NONE';
}
