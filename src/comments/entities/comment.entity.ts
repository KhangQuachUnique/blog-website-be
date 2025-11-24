import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';
import { ChildComment } from './child-comment.entity';
import { NormalUser } from 'src/users/entities/normal-user.entity';

@Entity('comments')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
@Index(['createAt'])
export abstract class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @OneToMany(() => ChildComment, (childComment) => childComment.parentComment, { cascade: true })
  childComments: ChildComment[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createAt: Date;

  // Relations
  @ManyToOne(() => NormalUser, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  commenter: NormalUser;
}
