import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { ENotificationType } from '../enums/notification.enum';

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ENotificationType })
  type: ENotificationType;

  /**
   * The title of the notification template.
   * type: POST_LIKED => "Your post was liked!"
   * type: POST_COMMENTED => "New comment on your post!"
   * type: POST_REACTED => "New reaction on your post!"
   * type: POST_SHARED => "Your post was shared!"
   * type: COMMENT_REPLIED => "New reply to your comment!"
   * type: COMMENT_LIKED => "Someone liked your comment!"
   * type: USER_FOLLOWED => "You have a new follower!"
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  /**
   * The message content of the notification template.
   * type: POST_LIKED => "liked your post."
   * type: POST_COMMENTED => "commented on your post."
   * type: POST_REACTED => "reacted to your post."
   * type: POST_SHARED => "shared your post."
   * type: COMMENT_LIKED => "liked your comment."
   * type: COMMENT_REPLIED => "replied to your comment."
   * type: USER_FOLLOWED => "started following you."
   */
  @Column({ type: 'text' })
  message: string;
}
