import { DataSource, IsNull } from 'typeorm';
import { Seeder } from '../seeder.base';
import { NotificationTemplate } from '../../notifications/entities/notification-template.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import {
  NotificationFactory,
  NotificationTemplateFactory,
} from '../factories/notification.factory';
import { UserVote } from '../../user-votes/entities/user-vote.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { UserReact } from '../../user-reacts/entities/user-react.entity';
import { ENotificationType } from '../../notifications/enums/notification.enum';

export class NotificationSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    console.log('🌱 Seeding Notifications...');

    const notificationTemplateRepository = this.dataSource.getRepository(NotificationTemplate);
    const notificationRepository = this.dataSource.getRepository(Notification);

    try {
      // 1. Create notification templates for all types
      console.log('  📝 Creating notification templates...');
      const templates = NotificationTemplateFactory.createAllTemplates();
      const savedTemplates = await notificationTemplateRepository.save(templates);
      this.success(`Created ${savedTemplates.length} notification templates`);

      // Create a map for quick template lookup
      const templateMap = new Map<ENotificationType, NotificationTemplate>();
      savedTemplates.forEach((t) => templateMap.set(t.type, t));

      // 2. Generate notifications from actual user actions
      console.log('  🔔 Creating notifications from user actions...');
      const notifications: Notification[] = [];

      // 2a. Notifications from votes
      const voteRepository = this.dataSource.getRepository(UserVote);
      const votes = await voteRepository.find({
        relations: ['user', 'post', 'post.author'],
        take: 200, // Limit to avoid too many notifications
      });

      const voteTemplate = templateMap.get(ENotificationType.USER_VOTED_POST);
      for (const vote of votes) {
        if (voteTemplate) {
          const notification = NotificationFactory.createFromVote(vote, voteTemplate);
          if (notification) notifications.push(notification);
        }
      }
      this.log(`Generated ${notifications.length} vote notifications`);

      // 2b. Notifications from post comments
      const commentRepository = this.dataSource.getRepository(Comment);
      const comments = await commentRepository.find({
        relations: ['commenter', 'post', 'post.author'],
        take: 200,
      });

      const commentTemplate = templateMap.get(ENotificationType.USER_COMMENTED_POST);
      let commentNotifCount = 0;
      for (const comment of comments) {
        if (commentTemplate) {
          const notification = NotificationFactory.createFromComment(comment, commentTemplate);
          if (notification) {
            notifications.push(notification);
            commentNotifCount++;
          }
        }
      }
      this.log(`Generated ${commentNotifCount} comment notifications`);

      // 2c. Notifications from post reactions
      const reactRepository = this.dataSource.getRepository(UserReact);
      const postReacts = await reactRepository
        .createQueryBuilder('react')
        .leftJoinAndSelect('react.user', 'user')
        .leftJoinAndSelect('react.emoji', 'emoji')
        .leftJoinAndSelect('react.post', 'post')
        .leftJoinAndSelect('post.author', 'author')
        .where('react.post_id IS NOT NULL')
        .take(200)
        .getMany();

      const reactTemplate = templateMap.get(ENotificationType.USER_REACTED_POST);
      let reactNotifCount = 0;
      for (const react of postReacts) {
        if (reactTemplate) {
          const notification = NotificationFactory.createFromReaction(react, reactTemplate);
          if (notification) {
            notifications.push(notification);
            reactNotifCount++;
          }
        }
      }
      this.log(`Generated ${reactNotifCount} reaction notifications`);

      // 2d. Notifications from comment reactions
      const commentReacts = await reactRepository
        .createQueryBuilder('react')
        .leftJoinAndSelect('react.user', 'user')
        .leftJoinAndSelect('react.emoji', 'emoji')
        .leftJoinAndSelect('react.comment', 'comment')
        .leftJoinAndSelect('comment.commenter', 'commenter')
        .where('react.comment_id IS NOT NULL')
        .take(100)
        .getMany();

      const commentReactTemplate = templateMap.get(ENotificationType.USER_LIKED_COMMENT);
      let commentReactNotifCount = 0;
      for (const react of commentReacts) {
        if (commentReactTemplate) {
          const notification = NotificationFactory.createFromCommentReaction(
            react,
            commentReactTemplate,
          );
          if (notification) {
            notifications.push(notification);
            commentReactNotifCount++;
          }
        }
      }
      this.log(`Generated ${commentReactNotifCount} comment reaction notifications`);

      // 2e. Notifications from comment replies
      const replyComments = await commentRepository
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.commenter', 'commenter')
        .leftJoinAndSelect('comment.parentComment', 'parentComment')
        .leftJoinAndSelect('parentComment.commenter', 'parentCommenter')
        .where('comment.parentCommentId IS NOT NULL')
        .take(100)
        .getMany();

      const replyTemplate = templateMap.get(ENotificationType.USER_REPLIED_COMMENT);
      let replyNotifCount = 0;
      for (const replyComment of replyComments) {
        if (replyTemplate) {
          const notification = NotificationFactory.createFromCommentReply(
            replyComment,
            replyTemplate,
          );
          if (notification) {
            notifications.push(notification);
            replyNotifCount++;
          }
        }
      }
      this.log(`Generated ${replyNotifCount} reply notifications`);

      // 3. Save all notifications
      if (notifications.length > 0) {
        await notificationRepository.save(notifications);
        this.success(`Created ${notifications.length} notifications total`);

        // Statistics
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        const readCount = notifications.filter((n) => n.isRead).length;
        console.log(`  📊 Unread: ${unreadCount}, Read: ${readCount}`);
      } else {
        this.log('No notifications generated (no actions found)');
      }

      this.success('Notifications seeded successfully');
    } catch (error) {
      this.error('Failed to seed notifications', error);
      throw error;
    }
  }
}
