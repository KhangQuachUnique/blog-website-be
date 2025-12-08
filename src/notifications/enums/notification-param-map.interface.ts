import { ENotificationType } from './notification.enum';
import {
  UserVotedPostParam,
  UserCommentedPostParam,
  UserReactedPostParam,
  UserSharedPostParam,
  UserLikedCommentParam,
  UserRepliedCommentParam,
  UserFollowedUserParam,
} from './notification-param.interface';

export interface NotificationParamMap {
  [ENotificationType.USER_VOTED_POST]: UserVotedPostParam;
  [ENotificationType.USER_COMMENTED_POST]: UserCommentedPostParam;
  [ENotificationType.USER_REACTED_POST]: UserReactedPostParam;
  [ENotificationType.USER_SHARED_POST]: UserSharedPostParam;
  [ENotificationType.USER_LIKED_COMMENT]: UserLikedCommentParam;
  [ENotificationType.USER_REPLIED_COMMENT]: UserRepliedCommentParam;
  [ENotificationType.USER_FOLLOWED_USER]: UserFollowedUserParam;

  [ENotificationType.CUSTOM]: { [key: string]: any };
}
