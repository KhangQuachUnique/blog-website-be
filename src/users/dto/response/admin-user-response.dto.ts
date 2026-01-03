import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EUserRole } from '../../enums/role.enum';
import { UserDetailResponseDto } from './user-response.dto';

/**
 * DTO response cho Admin list users
 * Extends UserDetailResponseDto và thêm các field chỉ admin mới cần
 */
export class AdminUserResponseDto extends UserDetailResponseDto {
  @Expose()
  @ApiProperty({ example: 'USER', enum: EUserRole })
  type: EUserRole;

  @Expose()
  @ApiProperty({ example: false })
  isBanned: boolean;

  @Expose()
  @ApiPropertyOptional({ example: '1990-01-01' })
  dob?: Date;
}

/**
 * DTO response cho paginated admin user list
 */
export class AdminUserListResponseDto {
  @ApiProperty({ type: [AdminUserResponseDto] })
  data: AdminUserResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
