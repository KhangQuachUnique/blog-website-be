import { Block } from 'src/blocks/entities/block.entity';
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
import { EBlogPostStatus } from '../enums/blog-post-status.enum';
import { Comment } from 'src/comments/entities/comment.entity';
import { User } from 'src/users/entities/user.entity';
import { ViewedHistory } from 'src/viewed-history/entities/viewed-history.entity';
import { EVoteType, UserVote } from 'src/user-votes/entities/user-vote.entity';
import { GetVotesInterface } from '../blog-post.interface';

@Entity('blog_posts')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
@Index(['createdAt'])
@Index(['isPublic'])
export abstract class BlogPost {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  shortDescription: string;

  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'boolean', default: true })
  isPublic: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'enum', enum: EBlogPostStatus, default: EBlogPostStatus.ACTIVE })
  status: EBlogPostStatus;

  // Relations
  @OneToMany(() => Comment, (comment) => comment.post, { cascade: true })
  comments: Comment[];

  @ManyToMany(() => Hashtag, (hashtag) => hashtag.posts)
  @JoinTable({
    name: 'post_hashtags',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'hashtagId', referencedColumnName: 'id' },
  })
  hashtags: Hashtag[];

  @OneToMany(() => Block, (block) => block.post, { cascade: true })
  blocks: Block[];

  @ManyToOne('User', {
    onDelete: 'SET NULL',
    nullable: true,
  })
  author: User;

  @OneToMany(() => ViewedHistory, (history) => history.post)
  viewedBy: ViewedHistory[];

  @OneToMany(() => UserVote, (vote) => vote.post)
  votes: UserVote[];

  getVotes(userId: number): GetVotesInterface {
    const upvotes = this.votes.filter((vote) => vote.voteType === EVoteType.UPVOTE).length;
    const downvotes = this.votes.filter((vote) => vote.voteType === EVoteType.DOWNVOTE).length;
    const userVote = this.votes.find((vote) => vote.user.id === userId)?.voteType || null;
    return {
      upvotes,
      downvotes,
      userVote,
    };
  }
}
