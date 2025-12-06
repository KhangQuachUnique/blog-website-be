import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationsGateWay } from './gateway/notifications.gateway';
import { SocketUserManager } from './sockets/socket-user.manager';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationTemplate])],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateWay, SocketUserManager],
  exports: [NotificationsService, NotificationsGateWay],
})
export class NotificationsModule {}
