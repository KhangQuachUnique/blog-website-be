import { CommunityBlogPost } from 'src/blog-posts/entities/community-blog-post.entity';
import { Emoji } from 'src/emojis/entities/emoji.entity';
import { NormalUser } from 'src/users/entities/normal-user.entity';
import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Community {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  thumbnailUrl: string;

  @Column()
  isPublic: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relations
  @OneToMany(() => CommunityBlogPost, (post) => post.community)
  posts: CommunityBlogPost[];

  @ManyToMany(() => NormalUser, (user) => user.communities)
  members: NormalUser[];

  @OneToMany(() => Emoji, (emoji) => emoji.community, { cascade: true })
  emojis: Emoji[];
}
