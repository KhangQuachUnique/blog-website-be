import { z } from 'zod';
import { ENotificationType } from '../enums/notification.enum';

export const NotificationParamSchemas = {
  [ENotificationType.USER_VOTED_POST]: z.object({
    postId: z.number(),
  }),
  [ENotificationType.USER_COMMENTED_POST]: z.object({
    postId: z.number(),
    commentId: z.number(),
  }),
  [ENotificationType.USER_REACTED_POST]: z.object({
    postId: z.number(),
    emojiId: z.string(),
  }),
  [ENotificationType.USER_SHARED_POST]: z.object({
    postId: z.number(),
  }),
  [ENotificationType.USER_LIKED_COMMENT]: z.object({
    commentId: z.number(),
  }),
  [ENotificationType.USER_REPLIED_COMMENT]: z.object({
    commentId: z.number(),
  }),
  [ENotificationType.USER_FOLLOWED_USER]: z.object({
    followedUserId: z.number(),
  }),
  [ENotificationType.CUSTOM]: z.record(z.string(), z.any()),
};
