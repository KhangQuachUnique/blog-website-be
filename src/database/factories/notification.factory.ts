import { Notification } from '../../notifications/entities/notification.entity';
import { NotificationTemplate } from '../../notifications/entities/notification-template.entity';
import { ENotificationType } from '../../notifications/enums/notification.enum';
import { User } from '../../users/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { UserReact } from '../../user-reacts/entities/user-react.entity';
import { UserVote } from '../../user-votes/entities/user-vote.entity';

export class NotificationFactory {
  /**
   * Create notification from a vote action
   */
  static createFromVote(vote: UserVote, template: NotificationTemplate): Notification | null {
    if (!vote.post?.author || vote.user.id === vote.post.author.id) return null;

    const notification = new Notification();
    notification.type = ENotificationType.USER_VOTED_POST;
    notification.sender = vote.user;
    notification.receiver = vote.post.author;
    notification.template = template;
    notification.params = { postId: vote.post.id };
    notification.isRead = Math.random() > 0.7; // 30% read
    return notification;
  }

  /**
   * Create notification from a comment action
   */
  static createFromComment(comment: Comment, template: NotificationTemplate): Notification | null {
    if (!comment.post?.author || comment.commenter.id === comment.post.author.id) return null;

    const notification = new Notification();
    notification.type = ENotificationType.USER_COMMENTED_POST;
    notification.sender = comment.commenter;
    notification.receiver = comment.post.author;
    notification.template = template;
    notification.params = { postId: comment.post.id, commentId: comment.id };
    notification.isRead = Math.random() > 0.7;
    return notification;
  }

  /**
   * Create notification from a reaction action
   */
  static createFromReaction(
    reaction: UserReact,
    template: NotificationTemplate,
  ): Notification | null {
    if (!reaction.post?.author || reaction.user.id === reaction.post.author.id) return null;

    const notification = new Notification();
    notification.type = ENotificationType.USER_REACTED_POST;
    notification.sender = reaction.user;
    notification.receiver = reaction.post.author;
    notification.template = template;
    notification.params = { postId: reaction.post.id, emojiId: reaction.emoji?.id || '1' };
    notification.isRead = Math.random() > 0.7;
    return notification;
  }

  /**
   * Create notification when user likes a comment
   */
  static createFromCommentReaction(
    reaction: UserReact,
    template: NotificationTemplate,
  ): Notification | null {
    if (!reaction.comment?.commenter || reaction.user.id === reaction.comment.commenter.id)
      return null;

    const notification = new Notification();
    notification.type = ENotificationType.USER_LIKED_COMMENT;
    notification.sender = reaction.user;
    notification.receiver = reaction.comment.commenter;
    notification.template = template;
    notification.params = { commentId: reaction.comment.id };
    notification.isRead = Math.random() > 0.7;
    return notification;
  }

  /**
   * Create notification when user replies to a comment
   */
  static createFromCommentReply(
    replyComment: Comment,
    template: NotificationTemplate,
  ): Notification | null {
    if (!replyComment.parentComment?.commenter || !replyComment.commenter) return null;
    if (replyComment.commenter.id === replyComment.parentComment.commenter.id) return null;

    const notification = new Notification();
    notification.type = ENotificationType.USER_REPLIED_COMMENT;
    notification.sender = replyComment.commenter;
    notification.receiver = replyComment.parentComment.commenter;
    notification.template = template;
    notification.params = { commentId: replyComment.id };
    notification.isRead = Math.random() > 0.7;
    return notification;
  }

  /**
   * Legacy method for backward compatibility
   */
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
    notification.type = template.type;
    notification.params = override.params || {};
    notification.isRead = override.isRead !== undefined ? override.isRead : false;
    return notification;
  }
}

export class NotificationTemplateFactory {
  static createAllTemplates(): NotificationTemplate[] {
    return [
      // USER_VOTED_POST
      {
        type: ENotificationType.USER_VOTED_POST,
        title: 'Bình chọn mới',
        message: 'đã bình chọn bài viết của bạn',
      },
      // USER_COMMENTED_POST
      {
        type: ENotificationType.USER_COMMENTED_POST,
        title: 'Bình luận mới',
        message: 'đã bình luận vào bài viết của bạn',
      },
      // USER_REACTED_POST
      {
        type: ENotificationType.USER_REACTED_POST,
        title: 'Phản ứng mới',
        message: 'đã phản ứng với bài viết của bạn',
      },
      // USER_SHARED_POST
      {
        type: ENotificationType.USER_SHARED_POST,
        title: 'Chia sẻ bài viết',
        message: 'đã chia sẻ bài viết của bạn',
      },
      // USER_LIKED_COMMENT
      {
        type: ENotificationType.USER_LIKED_COMMENT,
        title: 'Thích bình luận',
        message: 'đã thích bình luận của bạn',
      },
      // USER_REPLIED_COMMENT
      {
        type: ENotificationType.USER_REPLIED_COMMENT,
        title: 'Trả lời bình luận',
        message: 'đã trả lời bình luận của bạn',
      },
      // USER_FOLLOWED_USER
      {
        type: ENotificationType.USER_FOLLOWED_USER,
        title: 'Người theo dõi mới',
        message: 'đã bắt đầu theo dõi bạn',
      },
      // CUSTOM
      {
        type: ENotificationType.CUSTOM,
        title: 'Thông báo',
        message: 'Bạn có một thông báo mới',
      },
    ].map((t) => {
      const template = new NotificationTemplate();
      template.type = t.type;
      template.title = t.title;
      template.message = t.message;
      return template;
    });
  }
}
