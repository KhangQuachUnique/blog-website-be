import { EUserRole } from '../../users/enums/role.enum';

export class AuthResponseDto {
  accessToken: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: EUserRole;
  };
}
