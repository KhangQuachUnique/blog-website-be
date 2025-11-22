import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';

import { BlockComment } from '../../comments/entities/block-comment.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';

@Entity('blocks')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class Block {
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

  // Relations
  @ManyToOne(() => BlogPost, (post) => post.blocks, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  post: BlogPost;

  @OneToMany(() => BlockComment, (blockComment) => blockComment.block, { cascade: true })
  comments: BlockComment[];
}
