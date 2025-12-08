import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
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
  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  commenter: User;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  replyToUser: User;

  @ManyToOne(() => BlogPost, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  post: BlogPost;

  @ManyToOne(() => Block, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  block: Block;

  // Self-referencing for parent-child comments
  @ManyToOne(() => Comment, (comment) => comment.childComments, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  parentComment: Comment;

  @OneToMany(() => Comment, (comment) => comment.parentComment, { cascade: true })
  childComments: Comment[];
}
