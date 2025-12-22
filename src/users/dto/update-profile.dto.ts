import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  MaxLength,
  MinLength,
  IsUrl,
  ValidateIf,
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
  @ValidateIf((o: UpdateProfileDto) => o.avatarUrl !== '' && o.avatarUrl !== null)
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @ValidateIf((o: UpdateProfileDto) => o.coverImageUrl !== '' && o.coverImageUrl !== null)
  @IsUrl()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phoneNumber?: string;

  @IsOptional()
  @ValidateIf((o: UpdateProfileDto) => o.dob !== '' && o.dob !== null)
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsEnum(EGender)
  gender?: EGender;

  @IsOptional()
  @IsBoolean()
  showEmail?: boolean; 

  @IsOptional()
  @IsBoolean()
  showPhoneNumber?: boolean; 
}
