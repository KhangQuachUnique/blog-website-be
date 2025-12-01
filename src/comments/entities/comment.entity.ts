import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChildComment } from './child-comment.entity';
import { ECommentType } from '../enums/comment-type.enum';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Block } from 'src/blocks/entities/block.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('comments')
@Index(['createAt'])
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column({ type: 'enum', enum: ECommentType })
  type: ECommentType;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createAt: Date;

  // Relations
  @OneToMany(() => ChildComment, (childComment) => childComment.parentComment, { cascade: true })
  childComments: ChildComment[];

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  commenter: User;

  @Column({ name: 'commenterId', nullable: true })
  commenterId: number;

  @ManyToOne(() => BlogPost, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  post: BlogPost;

  @Column({ name: 'postId', nullable: true })
  postId: number;

  @ManyToOne(() => Block, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  block: Block;

  @Column({ name: 'blockId', nullable: true })
  blockId: number;
}
