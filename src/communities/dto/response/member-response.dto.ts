import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/users/dto/response/user-response.dto';

export class MemberResponseDto {
  @Expose()
  @ApiPropertyOptional()
  id: number;

  @Expose()
  @ApiPropertyOptional()
  role: any;

  @Expose()
  @ApiPropertyOptional()
  joinedAt: Date;

  @Expose()
  @Type(() => UserResponseDto)
  @ApiPropertyOptional()
  user: UserResponseDto;
}
