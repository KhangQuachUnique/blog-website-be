import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { EBlockType } from '../enums/block-type.enum';

@Entity('blocks')
export class Block {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  x: number;

  @Column()
  y: number;

  @Column()
  width: number;

  @Column()
  height: number;

  @Column({ type: 'enum', enum: EBlockType })
  type: EBlockType;

  @Column({ type: 'text' })
  content: string;

  // Relations
  @ManyToOne(() => BlogPost, (post) => post.blocks, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  post: BlogPost;

  @OneToMany(() => Comment, (comment) => comment.block, { cascade: true })
  comments: Comment[];
}
