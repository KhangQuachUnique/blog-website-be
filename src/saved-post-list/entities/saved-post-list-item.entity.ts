import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SavedPostList } from './saved-post-list.entity';

@Entity('saved_post_list_items')
export class SavedPostListItem {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  savedAt: Date;

  // Relations
  @ManyToOne(() => BlogPost, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  post: BlogPost;

  @ManyToOne(() => SavedPostList, (savedPostList) => savedPostList.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  savedPostList: SavedPostList;
}
