import { EUserRole } from '../../users/enums/role.enum';

export interface JwtPayload {
  sub: number;
  email: string;
  username: string;
  role: EUserRole;
}

export interface JwtUser {
  userId: number;
  id: number;
  email: string;
  username: string;
  role: EUserRole;
}
