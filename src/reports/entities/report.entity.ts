import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { EReportType } from '../enums/report-type.enum';
import { EReportStatus } from '../enums/report-status.enum';
import { User } from 'src/users/entities/user.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'enum', enum: EReportType })
  type: EReportType;

  @Column({ type: 'enum', enum: EReportStatus, default: EReportStatus.PENDING })
  status: EReportStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  // Relations
  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  reporter: User;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  reportedUser: User;

  @ManyToOne(() => Comment, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'reportedCommentId' })
  reportedComment: Comment | null;

  @ManyToOne(() => BlogPost, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  reportedPost: BlogPost;
}
