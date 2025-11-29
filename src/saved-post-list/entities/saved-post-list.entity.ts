import { Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SavedPostListItem } from './saved-post-list-item.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('saved_post_lists')
export class SavedPostList {
  @PrimaryGeneratedColumn()
  id: number;

  // Relations
  @OneToOne(() => User, (user) => user.savedPostList, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  user: User;

  @OneToMany(() => SavedPostListItem, (item) => item.savedPostList, {
    onDelete: 'CASCADE',
  })
  items: SavedPostListItem[];
}
