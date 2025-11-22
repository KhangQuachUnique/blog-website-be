import { ChildEntity, ManyToOne } from 'typeorm';
import { Report } from './report.entity';
import { Comment } from 'src/comments/entities/comment.entity';

@ChildEntity('comment')
export class CommentReport extends Report {
  @ManyToOne(() => Comment, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  comment: Comment;
}
