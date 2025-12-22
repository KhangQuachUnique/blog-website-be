import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('search_logs')
@Index(['keyword']) // Index để query top keywords nhanh hơn
@Index(['createdAt']) // Index để filter theo thời gian
export class SearchLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  keyword: string; // Đã được normalized: lowercase, trim

  @Column({ type: 'varchar', length: 50, default: 'all' })
  searchType: string; // 'all' | 'post' | 'user' | 'community' | 'hashtag'

  @Column({ nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'int', default: 0 })
  resultsCount: number; // Số kết quả tìm được (hữu ích cho analytics)

  @CreateDateColumn()
  createdAt: Date;
}
