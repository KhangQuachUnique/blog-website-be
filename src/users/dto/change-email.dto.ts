import { IsEmail, IsString, Length } from 'class-validator';

export class RequestChangeEmailDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  newEmail: string;
}

export class VerifyEmailDto {
  @IsEmail()
  newEmail: string;

  @IsString()
  @Length(6, 6, { message: 'Mã xác thực phải có 6 ký tự' })
  verificationCode: string;
}
