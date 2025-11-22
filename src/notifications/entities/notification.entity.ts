import { User } from 'src/users/entities/user.entity';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NotificationTemplate } from './notification-template.entity';

@Entity('notifications')
@Index(['isRead'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  isRead: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  sender: User;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  receiver: User;

  @ManyToOne(() => NotificationTemplate, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  template: NotificationTemplate;
}
