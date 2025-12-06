import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Comment } from './comment.entity';

@Entity('child_comments')
export class ChildComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createAt: Date;

  // Relations
  @ManyToOne(() => Comment, (comment) => comment.childComments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment: Comment;

  @Column({ name: 'parentCommentId', nullable: true })
  parentCommentId: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'commentUserId' })
  commentUser: User;

  @Column({ name: 'commentUserId', nullable: true })
  commentUserId: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'replyToUserId' })
  replyToUser: User;

  @Column({ name: 'replyToUserId', nullable: true })
  replyToUserId: number;
}

