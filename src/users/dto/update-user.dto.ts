import { PartialType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsBoolean,
  IsString,
  MinLength,
  MaxLength,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { EUserRole } from '../enums/role.enum';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  showPhoneNumber?: boolean;

  @IsOptional()
  @IsEnum(EUserRole)
  type?: EUserRole; // Admin có thể cập nhật role
}
