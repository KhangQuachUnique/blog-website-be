import { Expose, Type } from 'class-transformer';
import { ENotificationType } from 'src/notifications/enums/notification.enum';

export class SenderInfo {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  avatarUrl: string | null;
}

export class NotificationTemplateDto {
  @Expose()
  id: number;

  @Expose()
  type: ENotificationType;

  @Expose()
  title: string;

  @Expose()
  message: string;
}

export class NotificationResponseDto {
  @Expose()
  id: number;

  @Expose()
  isRead: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  type: ENotificationType;

  @Expose()
  params: Record<string, any>;

  @Expose()
  @Type(() => SenderInfo)
  sender: SenderInfo;

  @Expose()
  @Type(() => NotificationTemplateDto)
  template: NotificationTemplateDto;
}
