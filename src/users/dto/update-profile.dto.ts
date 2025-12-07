import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  IsBoolean,
  MaxLength,
  MinLength,
  IsUrl,
} from 'class-validator';
import { EGender } from '../enums/gender.enum';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phoneNumber?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsEnum(EGender)
  gender?: EGender;

  @IsOptional()
  @IsBoolean()
  showEmail?: boolean; // Cài đặt hiển thị email công khai

  @IsOptional()
  @IsBoolean()
  showPhoneNumber?: boolean; // Cài đặt hiển thị số điện thoại công khai
}
