import type { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('hashtags')
export class Hashtag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  name: string;

  // Relations
  @ManyToMany('BlogPost', 'hashtags')
  posts: BlogPost[];
}
