import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EUserRole } from '../../enums/role.enum';

/**
 * DTO response cho Admin list users
 * Bao gồm đầy đủ thông tin cần thiết cho quản lý
 */
export class AdminUserResponseDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'johndoe' })
  username: string;

  @Expose()
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @Expose()
  @ApiPropertyOptional({ example: '+84123456789' })
  phoneNumber?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Bio của người dùng' })
  bio?: string;

  @Expose()
  @ApiProperty({ example: 'USER', enum: EUserRole })
  type: EUserRole;

  @Expose()
  @ApiProperty({ example: false })
  isBanned: boolean;

  @Expose()
  @ApiProperty({ example: false })
  isPrivate: boolean;

  @Expose()
  @ApiPropertyOptional({ example: '1990-01-01' })
  dob?: Date;

  @Expose()
  @ApiPropertyOptional({ example: 'MALE' })
  gender?: string;

  @Expose()
  @ApiProperty({ example: '2024-01-01T12:00:00Z' })
  joinAt: Date;
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
