import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { ENotificationTemplateType } from '../enums/notification-template.enum';

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ENotificationTemplateType })
  type: ENotificationTemplateType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;
}
