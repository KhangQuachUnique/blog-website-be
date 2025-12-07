import { IsEnum, IsOptional } from 'class-validator';
import { ECommunityRole } from '../enums/community-role.enum';
import { ECommunityMemberStatus } from '../enums/community-member-status.enum';

export class UpdateCommunityMemberDto {
  @IsOptional()
  @IsEnum(ECommunityRole)
  role?: ECommunityRole;

  @IsOptional()
  @IsEnum(ECommunityMemberStatus)
  status?: ECommunityMemberStatus;
}
