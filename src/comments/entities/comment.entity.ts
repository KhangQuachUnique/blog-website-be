import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { ChildComment } from './child-comment.entity';
import { User } from 'src/users/entities/user.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Block } from 'src/blocks/entities/block.entity';

@Entity('comments')
@Index(['createAt'])
@Index(['type'])
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  content: string;

  @Column({ type: 'varchar' })
  type: string; // 'post' or 'block'

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createAt: Date;

  // Foreign Keys matching database schema
  @Column({ nullable: true })
  commenterId: number;

  @Column({ nullable: true })
  postId: number;

  @Column({ nullable: true })
  blockId: number;

  // Relations
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'commenterId' })
  commenter: User;

  @ManyToOne(() => BlogPost, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'postId' })
  post: BlogPost;

  @ManyToOne(() => Block, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'blockId' })
  block: Block;

  @OneToMany(() => ChildComment, (childComment) => childComment.parentComment, { 
    cascade: true,
    eager: false 
  })
  childComments: ChildComment[];
}
