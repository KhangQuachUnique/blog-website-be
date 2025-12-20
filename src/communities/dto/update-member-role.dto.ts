// update-member-role.dto.ts
import { IsEnum, IsNotEmpty } from "class-validator";
import { ECommunityRole } from "../enums/community-role.enum";

export class UpdateMemberRoleDto {
  @IsNotEmpty()
  @IsEnum(ECommunityRole)
  role: ECommunityRole;
}
