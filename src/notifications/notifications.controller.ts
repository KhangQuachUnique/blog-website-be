import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto } from './dto/response/notification-response.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('mark-as-read/:notificationId')
  markAsRead(@Param('notificationId') notificationId: number) {
    return this.notificationsService.markAsRead(notificationId);
  }

  @Post('mark-all-as-read/:userId')
  markAllAsRead(@Param('userId') userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Get(':userId')
  findAll(@Param('userId') userId: number): Promise<NotificationResponseDto[]> {
    return this.notificationsService.findAll(userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(+id);
  }
}
