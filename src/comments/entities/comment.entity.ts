import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ECommentType } from '../enums/comment-type.enum';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Block } from 'src/blocks/entities/block.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('comments')
@Index(['createAt'])
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: ECommentType })
  type: ECommentType;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'commenterId' })
  commenter: User;

  @Column({ name: 'commenterId', nullable: true })
  commenterId: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'replyToUserId' })
  replyToUser: User;

  @Column({ name: 'replyToUserId', nullable: true })
  replyToUserId: number;

  @ManyToOne(() => BlogPost, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'postId' })
  post: BlogPost;

  @Column({ name: 'postId', nullable: true })
  postId: number;

  @ManyToOne(() => Block, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'blockId' })
  block: Block;

  @Column({ name: 'blockId', nullable: true })
  blockId: number;

  // Self-referencing for parent-child comments
  @ManyToOne(() => Comment, (comment) => comment.childComments, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment: Comment;

  @Column({ name: 'parentCommentId', nullable: true })
  parentCommentId: number;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  childComments: Comment[];
}
