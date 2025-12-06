import { IsInt, IsPositive } from 'class-validator';

export class BlockUserDto {
  @IsInt()
  @IsPositive()
  targetUserId: number;
}
