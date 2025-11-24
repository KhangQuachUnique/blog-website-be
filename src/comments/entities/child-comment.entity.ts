import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Comment } from './comment.entity';

@Entity('child_comments')
export class ChildComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createAt: Date;

  // Foreign Keys matching database schema
  @Column({ nullable: true })
  parentCommentId: number;

  @Column({ nullable: true })
  commentUserId: number;

  @Column({ nullable: true })
  replyToUserId: number;

  // Relations
  @ManyToOne(() => Comment, (comment) => comment.childComments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment: Comment;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'commentUserId' })
  commentUser: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'replyToUserId' })
  replyToUser: User;
}
