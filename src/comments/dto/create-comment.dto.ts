import { IsString, IsEnum, IsOptional, IsNumber, ValidateIf } from 'class-validator';
import { ECommentType } from '../enums/comment-type.enum';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsEnum(ECommentType)
  type: ECommentType;

  @IsNumber()
  commenterId: number;

  // postId bắt buộc khi type = POST
  @ValidateIf((o) => o.type === ECommentType.POST)
  @IsNumber()
  postId?: number;

  // blockId bắt buộc khi type = BLOCK  
  @ValidateIf((o) => o.type === ECommentType.BLOCK)
  @IsNumber()
  blockId?: number;

  // Gộp các trường reply
  @IsOptional()
  @IsNumber()
  parentCommentId?: number;

  @IsOptional()
  @IsNumber()
  replyToUserId?: number;
}
