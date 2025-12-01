import { Block } from 'src/blocks/entities/block.entity';
import { PostComment } from 'src/comments/entities/post-comment.entity';
import { NormalUser } from 'src/users/entities/normal-user.entity';
import { Hashtag } from 'src/hashtags/entities/hashtag.entity';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';

@Entity('blog_posts')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
@Index(['createdAt'])
@Index(['isPublic'])
export abstract class BlogPost {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  thumbnailUrl: string;

  @Column({ type: 'int', default: 0 })
  upVotes: number;

  @Column({ type: 'int', default: 0 })
  downVotes: number;

  @Column({ type: 'boolean', default: true })
  isPublic: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relations
  @OneToMany(() => PostComment, (postComment) => postComment.post, { cascade: true })
  comments: PostComment[];

  @ManyToMany(() => Hashtag, (hashtag) => hashtag.posts)
  @JoinTable({
    name: 'post_hashtags',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'hashtagId', referencedColumnName: 'id' },
  })
  hashtags: Hashtag[];

  @OneToMany(() => Block, (block) => block.post, { cascade: true })
  blocks: Block[];

  @ManyToOne(() => NormalUser, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  author: NormalUser;
}
