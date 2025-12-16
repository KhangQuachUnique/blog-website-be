import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class HashtagResponseDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'nestjs' })
  name: string;
}
