import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateChildCommentDto {
  @IsString()
  content: string;

  @IsNumber()
  parentCommentId: number;

  @IsNumber()
  commentUserId: number;

  @IsOptional()
  @IsNumber()
  replyToUserId?: number;
}
