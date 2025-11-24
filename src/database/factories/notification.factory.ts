import { Notification } from '../../notifications/entities/notification.entity';
import { NotificationTemplate } from '../../notifications/entities/notification-template.entity';
import { User } from '../../users/entities/user.entity';

export class NotificationFactory {
  static create(
    sender: User,
    receiver: User,
    template: NotificationTemplate,
    override: Partial<Notification> = {},
  ): Notification {
    const notification = new Notification();

    notification.sender = sender;
    notification.receiver = receiver;
    notification.template = template;
    notification.isRead = override.isRead !== undefined ? override.isRead : false;

    return notification;
  }

  static createBatch(
    senders: User[],
    receivers: User[],
    templates: NotificationTemplate[],
    count: number,
  ): Notification[] {
    const notifications: Notification[] = [];

    for (let i = 0; i < count; i++) {
      const sender = senders[Math.floor(Math.random() * senders.length)];
      const receiver = receivers[Math.floor(Math.random() * receivers.length)];
      const template = templates[Math.floor(Math.random() * templates.length)];

      // Don't send notification to self
      if (sender.id === receiver.id) continue;

      // 70% unread, 30% read
      const isRead = Math.random() > 0.7;

      notifications.push(this.create(sender, receiver, template, { isRead }));
    }

    return notifications;
  }

  static createForReceiver(
    senders: User[],
    receiver: User,
    templates: NotificationTemplate[],
    count: number,
  ): Notification[] {
    const notifications: Notification[] = [];

    for (let i = 0; i < count; i++) {
      const sender = senders[Math.floor(Math.random() * senders.length)];
      const template = templates[Math.floor(Math.random() * templates.length)];

      // Don't send notification to self
      if (sender.id === receiver.id) continue;

      // Recent notifications are mostly unread
      const isRead = Math.random() > 0.8;

      notifications.push(this.create(sender, receiver, template, { isRead }));
    }

    return notifications;
  }
}

export class NotificationTemplateFactory {
  static readonly TEMPLATES_VI = [
    { title: 'Bình luận mới', message: '{sender} đã bình luận vào bài viết của bạn' },
    { title: 'Thích bài viết', message: '{sender} đã thích bài viết của bạn' },
    { title: 'Theo dõi', message: '{sender} đã theo dõi bạn' },
    { title: 'Nhắc đến', message: '{sender} đã nhắc đến bạn trong một bình luận' },
    { title: 'Chia sẻ', message: '{sender} đã chia sẻ bài viết của bạn' },
    { title: 'Trả lời', message: '{sender} đã trả lời bình luận của bạn' },
    { title: 'Tham gia cộng đồng', message: '{sender} đã tham gia cộng đồng của bạn' },
    { title: 'Mời vào cộng đồng', message: '{sender} đã mời bạn tham gia cộng đồng' },
    { title: 'Bài viết mới', message: 'Có bài viết mới từ {sender}' },
    { title: 'Phản ứng', message: '{sender} đã phản ứng với bài viết của bạn' },
  ];

  static readonly TEMPLATES_EN = [
    { title: 'New Comment', message: '{sender} commented on your post' },
    { title: 'Post Like', message: '{sender} liked your post' },
    { title: 'New Follower', message: '{sender} started following you' },
    { title: 'Mention', message: '{sender} mentioned you in a comment' },
    { title: 'Share', message: '{sender} shared your post' },
    { title: 'Reply', message: '{sender} replied to your comment' },
    { title: 'Community Join', message: '{sender} joined your community' },
    { title: 'Community Invite', message: '{sender} invited you to join a community' },
    { title: 'New Post', message: 'New post from {sender}' },
    { title: 'Reaction', message: '{sender} reacted to your post' },
  ];

  static createTemplate(title: string, message: string): NotificationTemplate {
    const template = new NotificationTemplate();
    template.title = title;
    template.message = message;
    return template;
  }

  static createAllTemplates(useVietnamese = true): NotificationTemplate[] {
    const templates = useVietnamese ? this.TEMPLATES_VI : this.TEMPLATES_EN;
    return templates.map((t) => this.createTemplate(t.title, t.message));
  }

  static createMixedTemplates(): NotificationTemplate[] {
    // Mix both languages
    return [
      ...this.TEMPLATES_VI.map((t) => this.createTemplate(t.title, t.message)),
      ...this.TEMPLATES_EN.map((t) => this.createTemplate(t.title, t.message)),
    ];
  }
}
