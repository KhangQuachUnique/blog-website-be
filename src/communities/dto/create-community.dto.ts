// src/communities/dto/create-community.dto.ts
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateCommunityDto {
  @IsString()
  @Length(3, 100, { message: 'Tên cộng đồng phải từ 3 đến 100 ký tự.' })
  name: string;

  @IsString()
  @Length(1, 500, { message: 'Mô tả cộng đồng phải từ 1 đến 500 ký tự.' }) // có thể tăng lên
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
