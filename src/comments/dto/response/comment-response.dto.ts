import { Expose, Type } from 'class-transformer';
import { ECommentType } from 'src/comments/enums/comment-type.enum';

class CommentUser {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  avatarUrl: string;
}

export class CommentResponseDto {
  @Expose()
  id: number;

  @Expose()
  content: string;

  @Expose()
  type: ECommentType;

  @Expose()
  createAt: Date;

  @Expose()
  @Type(() => CommentUser)
  commenter: CommentUser;

  @Expose()
  @Type(() => CommentUser)
  replyToUser?: CommentUser;

  @Expose()
  @Type(() => CommentResponseDto)
  childComments?: Omit<CommentResponseDto, 'childComments'>[];
}
