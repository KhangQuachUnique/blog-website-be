import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export enum CommentType {
  POST = 'post',
  BLOCK = 'block',
}

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(CommentType)
  type: CommentType;

  @IsNumber()
  commenterId: number;

  // Chỉ một trong hai: postId hoặc blockId
  @IsOptional()
  @IsNumber()
  postId?: number;

  @IsOptional()
  @IsNumber()
  blockId?: number;
}

export class CreateChildCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  parentCommentId: number;

  @IsNumber()
  commentUserId: number;

  @IsOptional()
  @IsNumber()
  replyToUserId?: number; // Nếu reply specific user
}
