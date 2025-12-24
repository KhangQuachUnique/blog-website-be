import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EGender } from 'src/users/enums/gender.enum';

export class UserResponseDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'johndoe' })
  username: string;

  @Expose()
  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  coverImageUrl?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'male' })
  gender: EGender;

  @Expose()
  @ApiPropertyOptional({ example: 'Người thích viết blog' })
  bio?: string;

  @Expose()
  @ApiPropertyOptional({ example: false })
  isFollowing?: boolean;

  @Expose()
  @ApiProperty({ example: false })
  isPrivate: boolean;

  @Expose()
  @ApiPropertyOptional({ example: '2024-01-01T12:00:00Z' })
  joinAt?: Date;
}

export class UserDetailResponseDto extends UserResponseDto {
  @Expose()
  @ApiPropertyOptional({ example: 'john@example.com' })
  email?: string;

  @Expose()
  @ApiPropertyOptional({ example: '+84123456789' })
  phoneNumber?: string;
}
