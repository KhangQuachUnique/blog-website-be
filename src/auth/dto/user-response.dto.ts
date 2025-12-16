import { EUserRole } from '../../users/enums/role.enum';

export class UserResponseDto {
  id: number;
  username: string;
  email: string;
  role: EUserRole;
  avatarUrl: string | null;
  bio: string | null;
  phoneNumber: string | null;
}
