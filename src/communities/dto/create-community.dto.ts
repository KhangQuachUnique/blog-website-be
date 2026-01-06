// src/communities/dto/create-community.dto.ts
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateCommunityDto {
  @IsString()
  @Length(3, 100)
  name: string;

  @IsString()
  @Length(1, 500) // có thể tăng lên
  description: string;

  @IsString()
  // có thể thêm @IsUrl() bắt buộc phải là URL
  thumbnailUrl: string;

  @IsBoolean()
  isPublic: boolean;

  // 2 flag này có default = false ở entity, để optional
  @IsOptional()
  @IsBoolean()
  requirePostApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  requireMemberApproval?: boolean;
}
