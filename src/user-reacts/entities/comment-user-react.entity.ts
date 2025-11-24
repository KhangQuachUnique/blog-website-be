import { Comment } from 'src/comments/entities/comment.entity';
import { ChildEntity, ManyToOne } from 'typeorm';
import { UserReact } from './user-react.entity';

@ChildEntity('comment_user_reacts')
export class CommentUserReact extends UserReact {
  @ManyToOne(() => Comment, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  comment: Comment;
}
