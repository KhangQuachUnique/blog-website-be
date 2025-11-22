import { NormalUser } from 'src/users/entities/normal-user.entity';
import { Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SavedPostListItem } from './saved-post-list-item.entity';

@Entity('saved_post_lists')
export class SavedPostList {
  @PrimaryGeneratedColumn()
  id: number;

  // Relations
  @OneToOne(() => NormalUser, (user) => user.savedPostList, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  user: NormalUser;

  @OneToMany(() => SavedPostListItem, (item) => item.savedPostList, {
    onDelete: 'CASCADE',
  })
  items: SavedPostListItem[];
}
