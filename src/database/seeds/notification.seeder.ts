import { DataSource } from 'typeorm';
import { Seeder } from '../seeder.base';
import { NotificationTemplate } from '../../notifications/entities/notification-template.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import {
  NotificationFactory,
  NotificationTemplateFactory,
} from '../factories/notification.factory';
import { User } from '../../users/entities/user.entity';

export class NotificationSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    console.log('🌱 Seeding Notifications...');

    const notificationTemplateRepository = this.dataSource.getRepository(NotificationTemplate);
    const notificationRepository = this.dataSource.getRepository(Notification);
    const userRepository = this.dataSource.getRepository(User);

    try {
      // 1. Create notification templates (both Vi and En)
      console.log('  📝 Creating notification templates...');
      const templates = NotificationTemplateFactory.createMixedTemplates();
      const savedTemplates = await notificationTemplateRepository.save(templates);
      this.success(`Created ${savedTemplates.length} notification templates`);

      // 2. Get users
      const users = await userRepository.find();

      if (users.length === 0) {
        this.error('No users found. Please run UserSeeder first.');
        return;
      }

      // 3. Create notifications for users
      console.log('  🔔 Creating notifications...');
      const notifications: Notification[] = [];

      // Each user receives 5-20 notifications
      for (const user of users) {
        const notificationCount = Math.floor(Math.random() * 16) + 5;
        const userNotifications = NotificationFactory.createForReceiver(
          users,
          user,
          savedTemplates,
          notificationCount,
        );
        notifications.push(...userNotifications);
      }

      await notificationRepository.save(notifications);
      this.success(`Created ${notifications.length} notifications for ${users.length} users`);

      // Statistics
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      const readCount = notifications.filter((n) => n.isRead).length;
      console.log(`  📊 Unread: ${unreadCount}, Read: ${readCount}`);

      this.success('✓ Notifications seeded successfully');
    } catch (error) {
      this.error('Failed to seed notifications', error);
      throw error;
    }
  }
}
