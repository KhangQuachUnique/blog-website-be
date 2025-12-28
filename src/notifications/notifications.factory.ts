import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from './entities/notification.entity';
import { ENotificationType } from './enums/notification.enum';
import { NotificationParamSchemas } from './schemas/notification.schemas';
import { NotificationParamMap } from './enums/notification-param-map.interface';
import { NotificationTemplate } from './entities/notification-template.entity';

export class NotificationFactory {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,

    @InjectRepository(NotificationTemplate)
    private notificationTemplateRepository: Repository<NotificationTemplate>,
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

    const template = await this.notificationTemplateRepository.findOne({
      where: { type: type as ENotificationType },
    });

    const notification = this.notificationRepository.create({
      type: type as ENotificationType,
      receiver: { id: receiverId },
      sender: { id: senderId },
      params,
      isRead: false,
      template: template || undefined,
    });
    return this.notificationRepository.save(notification);
  }
}
