import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EUserRole } from '../enums/role.enum';

/**
 * DTO cho việc update role của user (Admin only)
 */
export class UpdateUserRoleDto {
  @IsNotEmpty({ message: 'Role không được để trống' })
  @IsEnum(EUserRole, { message: 'Role phải là USER hoặc ADMIN' })
  role: EUserRole;
}

/**
 * DTO cho việc ban user (Admin only)
 */
export class BanUserDto {
  @IsOptional()
  @IsString({ message: 'Lý do phải là chuỗi' })
  @MaxLength(500, { message: 'Lý do không được quá 500 ký tự' })
  reason?: string;
}

/**
 * DTO cho việc tạo user mới (Admin only)
 */
export class AdminCreateUserDto {
  @IsNotEmpty({ message: 'Username không được để trống' })
  @IsString({ message: 'Username phải là chuỗi' })
  username: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsString({ message: 'Email phải là chuỗi' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  password: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(EUserRole, { message: 'Role phải là USER hoặc ADMIN' })
  type?: EUserRole;
}

/**
 * DTO cho việc update user bởi Admin
 */
export class AdminUpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Username phải là chuỗi' })
  username?: string;

  @IsOptional()
  @IsString({ message: 'Email phải là chuỗi' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(EUserRole, { message: 'Role phải là USER hoặc ADMIN' })
  type?: EUserRole;
}

/**
 * Query params cho admin list users
 */
export class AdminUserQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'BANNED' | 'ALL';

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
