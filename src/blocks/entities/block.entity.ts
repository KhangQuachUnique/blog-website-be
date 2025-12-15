import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { EBlockType, ObjectFit } from '../enums/block-type.enum';

@Entity('blocks')
export class Block {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { unsigned: true })
  x: number;

  @Column('int', { unsigned: true })
  y: number;

  @Column('int', { unsigned: true })
  width: number;

  @Column('int', { unsigned: true })
  height: number;

  @Column({ type: 'enum', enum: EBlockType })
  type: EBlockType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', nullable: true })
  imageCaption: string | null;

  @Column({ type: 'enum', enum: ObjectFit, nullable: true })
  objectFit: ObjectFit | null;

  // Relations
  @ManyToOne(() => BlogPost, (post) => post.blocks, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  post: BlogPost;

  @OneToMany(() => Comment, (comment) => comment.block, { cascade: true })
  comments: Comment[];
}
