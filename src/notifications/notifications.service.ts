import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationsGateWay } from './gateway/notifications.gateway';
import { NotificationFactory } from './notifications.factory';
import { ENotificationType } from './enums/notification.enum';
import { NotificationResponseDto } from './dto/response/notification-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,

    @InjectRepository(NotificationTemplate)
    private notificationTemplateRepository: Repository<NotificationTemplate>,

    private readonly notificationsGateWay: NotificationsGateWay,

    private readonly notificationFactory: NotificationFactory,
  ) {}

  /**
   * Đánh dấu đã đọc thông báo
   * @param notificationId
   * @returns
   */
  async markAsRead(notificationId: number) {
    return await this.notificationRepository.update({ id: notificationId }, { isRead: true });
  }

  /**
   * Dánh dấu tất cả thông báo của user đã đọc
   * @param userId
   * @returns
   */
  async markAllAsRead(userId: number) {
    return await this.notificationRepository.update({ receiver: { id: userId } }, { isRead: true });
  }

  /**
   * Get all notifications for a specific user
   * @param userId
   * @returns
   */
  async findAll(userId: number): Promise<NotificationResponseDto[]> {
    const notis = await this.notificationRepository.find({
      where: { receiver: { id: userId } },
      relations: ['sender', 'receiver', 'template'],
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(NotificationResponseDto, notis, { excludeExtraneousValues: true });
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }

  /**
   * Send notification when a user votes on a post
   * @param receiverId
   * @param senderId
   * @param postId
   * @returns
   */
  async sendUserVotedPostNotification(
    receiverId: number,
    senderId: number,
    postId: number,
  ): Promise<Notification> {
    const notification = await this.notificationFactory.createNotification(
      ENotificationType.USER_VOTED_POST,
      receiverId,
      senderId,
      { postId },
    );
    this.notificationsGateWay.emitToClient(receiverId, notification);
    return notification;
  }

  /**
   * Send notification when a user comments on a post
   * @param receiverId
   * @param senderId
   * @param postId
   * @param commentId
   * @returns
   */
  async sendUserCommentedPostNotification(
    receiverId: number,
    senderId: number,
    postId: number,
    commentId: number,
  ): Promise<Notification> {
    const notification = await this.notificationFactory.createNotification(
      ENotificationType.USER_COMMENTED_POST,
      receiverId,
      senderId,
      { postId, commentId },
    );
    this.notificationsGateWay.emitToClient(receiverId, notification);
    return notification;
  }

  /**
   * Send notification when a user reacts to a post
   * @param receiverId
   * @param senderId
   * @param postId
   * @param emojiId
   * @returns
   */
  async sendUserReactedPostNotification(
    receiverId: number,
    senderId: number,
    postId: number,
    emojiId: string,
  ): Promise<Notification> {
    const notification = await this.notificationFactory.createNotification(
      ENotificationType.USER_REACTED_POST,
      receiverId,
      senderId,
      { postId, emojiId },
    );
    this.notificationsGateWay.emitToClient(receiverId, notification);
    return notification;
  }

  /**
   * Send notification when a user shares a post
   * @param receiverId
   * @param senderId
   * @param postId
   * @returns
   */
  async sendUserSharedPostNotification(
    receiverId: number,
    senderId: number,
    postId: number,
  ): Promise<Notification> {
    const notification = await this.notificationFactory.createNotification(
      ENotificationType.USER_SHARED_POST,
      receiverId,
      senderId,
      { postId },
    );
    this.notificationsGateWay.emitToClient(receiverId, notification);
    return notification;
  }

  /**
   * Send notification when a user likes a comment
   * @param receiverId
   * @param senderId
   * @param commentId
   * @returns
   */
  async sendUserLikedCommentNotification(
    receiverId: number,
    senderId: number,
    commentId: number,
  ): Promise<Notification> {
    const notification = await this.notificationFactory.createNotification(
      ENotificationType.USER_LIKED_COMMENT,
      receiverId,
      senderId,
      { commentId },
    );
    this.notificationsGateWay.emitToClient(receiverId, notification);
    return notification;
  }

  /**
   * Send notification when a user replies to a comment
   * @param receiverId
   * @param senderId
   * @param commentId
   * @returns
   */
  async sendUserRepliedCommentNotification(
    receiverId: number,
    senderId: number,
    commentId: number,
  ): Promise<Notification> {
    const notification = await this.notificationFactory.createNotification(
      ENotificationType.USER_REPLIED_COMMENT,
      receiverId,
      senderId,
      { commentId },
    );
    this.notificationsGateWay.emitToClient(receiverId, notification);
    return notification;
  }

  /**
   * Send notification when a user follows another user
   * @param receiverId
   * @param senderId
   * @param followedUserId
   * @returns
   */
  async sendUserFollowedUserNotification(
    receiverId: number,
    senderId: number,
    followedUserId: number,
  ): Promise<Notification> {
    const notification = await this.notificationFactory.createNotification(
      ENotificationType.USER_FOLLOWED_USER,
      receiverId,
      senderId,
      { followedUserId },
    );
    this.notificationsGateWay.emitToClient(receiverId, notification);
    return notification;
  }

  /**
   * Send a custom notification
   * @param receiverId
   * @param senderId
   * @param params
   * @returns
   */
  async sendCustomToClientNotification(
    receiverId: number,
    senderId: number,
    params: { [key: string]: any },
  ): Promise<Notification> {
    const notification = await this.notificationFactory.createNotification(
      ENotificationType.CUSTOM,
      receiverId,
      senderId,
      params,
    );
    this.notificationsGateWay.emitToClient(receiverId, notification);
    return notification;
  }

  /**
   * Send a custom notification to all users
   * @param senderId
   * @param params
   * @returns
   */
  async sendCustomToAllClientNotification(
    senderId: number,
    params: { [key: string]: any },
  ): Promise<Notification[]> {
    const userIds: number[] = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('DISTINCT notification.receiverId', 'receiverId')
      .getRawMany()
      .then((results: { receiverId: number }[]) => results.map((r) => r.receiverId));
    const notifications: Notification[] = [];
    for (const receiverId of userIds) {
      const notification = await this.notificationFactory.createNotification(
        ENotificationType.CUSTOM,
        receiverId,
        senderId,
        params,
      );
      this.notificationsGateWay.emitToClient(receiverId, notification);
      notifications.push(notification);
    }
    return notifications;
  }
}
