import { IsEnum, IsOptional } from 'class-validator';
import { ECommunityRole } from '../enums/community-role.enum';

export class UpdateCommunityMemberDto {
  @IsOptional()
  @IsEnum(ECommunityRole)
  role?: ECommunityRole;
}
