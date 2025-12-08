import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from './entities/notification.entity';
import { ENotificationType } from './enums/notification.enum';
import { NotificationParamSchemas } from './schemas/notification.schemas';
import { NotificationParamMap } from './enums/notification-param-map.interface';

export class NotificationFactory {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification<T extends keyof NotificationParamMap>(
    type: T,
    receiverId: number,
    senderId: number,
    params: NotificationParamMap[T],
  ): Promise<Notification> {
    const schema = NotificationParamSchemas[type as ENotificationType];
    if (schema) {
      schema.parse(params);
    }

    const notification = this.notificationRepository.create({
      type: type as ENotificationType,
      receiver: { id: receiverId },
      sender: { id: senderId },
      params,
      isRead: false,
    });
    return this.notificationRepository.save(notification);
  }
}
