import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';

export enum EVoteType {
  UPVOTE = 'upvote',
  DOWNVOTE = 'downvote',
}

@Entity('user_votes')
@Unique(['user', 'post'])
export class UserVote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: EVoteType,
    enumName: 'e_vote_type',
  })
  voteType: EVoteType;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => BlogPost, { onDelete: 'CASCADE' })
  post: BlogPost;
}
