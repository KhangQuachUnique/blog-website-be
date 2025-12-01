import { Emoji } from 'src/emojis/entities/emoji.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EReactTargetType } from '../enums/react-target-type.enum';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Comment } from 'src/comments/entities/comment.entity';

@Entity('user_reacts')
export class UserReact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: EReactTargetType })
  type: EReactTargetType;

  // Relations
  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  user: User;

  @ManyToOne(() => Emoji, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  emoji: Emoji;

  @ManyToOne(() => BlogPost, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  post: BlogPost;

  @ManyToOne(() => Comment, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  comment: Comment;
}
