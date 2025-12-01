import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ECommentType } from '../enums/comment-type.enum';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsEnum(ECommentType)
  type: ECommentType;

  @IsNumber()
  commenterId: number;

  @IsOptional()
  @IsNumber()
  postId?: number;

  @IsOptional()
  @IsNumber()
  blockId?: number;
}
