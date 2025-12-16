import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  emailOrUsername: string; // Có thể là email hoặc username

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
