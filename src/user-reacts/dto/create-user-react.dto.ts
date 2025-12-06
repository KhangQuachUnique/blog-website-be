import { IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EReactTargetType } from '../enums/react-target-type.enum';

export class CreateUserReactDto {
  @ApiProperty({ example: 1, description: 'ID của user' })
  @IsNumber()
  userId: number;

  @ApiProperty({ example: 1, description: 'ID của emoji' })
  @IsNumber()
  emojiId: number;

  @ApiProperty({ enum: EReactTargetType, example: 'post', description: 'Loại target' })
  @IsEnum(EReactTargetType)
  type: EReactTargetType;

  @ApiPropertyOptional({ example: 1, description: 'ID của post (nếu react post)' })
  @IsOptional()
  @IsNumber()
  postId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID của comment (nếu react comment)' })
  @IsOptional()
  @IsNumber()
  commentId?: number;
}
