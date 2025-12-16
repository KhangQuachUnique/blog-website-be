import { Emoji } from 'src/emojis/entities/emoji.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, ManyToOne, PrimaryGeneratedColumn, Index, Unique, CreateDateColumn } from 'typeorm';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Comment } from 'src/comments/entities/comment.entity';

/**
 * 🎯 UserReact Entity - Discord-style Multi-Reaction System
 * 
 * Business Rules:
 * - Mỗi user có thể react nhiều emoji khác nhau cho 1 target
 * - Mỗi emoji chỉ được react 1 lần / user / target
 * - DB enforce uniqueness (không check bằng code)
 * 
 * Architecture:
 * - Information Expert: UserReact biết về reactions
 * - Low Coupling: Không chứa business logic, chỉ data + constraints
 */
@Entity('user_reacts')
// 🔒 Unique: 1 user chỉ react 1 lần với cùng emoji cho cùng target
@Unique('UQ_user_react_post', ['user', 'post', 'emoji'])
@Unique('UQ_user_react_comment', ['user', 'comment', 'emoji'])
// 📊 Indexes: Optimize queries
@Index('IDX_user_react_post', ['post'])
@Index('IDX_user_react_comment', ['comment'])
@Index('IDX_user_react_emoji', ['emoji'])
export class UserReact {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  // 👤 Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  user: User;

  @ManyToOne(() => Emoji, { onDelete: 'CASCADE', nullable: false })
  emoji: Emoji;

  @ManyToOne(() => BlogPost, { onDelete: 'CASCADE', nullable: true })
  post: BlogPost | null;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE', nullable: true })
  comment: Comment | null;
}
