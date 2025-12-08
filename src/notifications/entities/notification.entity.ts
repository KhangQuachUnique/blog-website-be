import { User } from 'src/users/entities/user.entity';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NotificationTemplate } from './notification-template.entity';
import { ENotificationType } from '../enums/notification.enum';

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

  @Column({ type: 'enum', enum: ENotificationType })
  type: ENotificationType;

  @Column({ type: 'json', nullable: true })
  params: Record<string, any>;

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
