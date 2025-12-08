export interface UserVotedPostParam {
  postId: number;
}

export interface UserCommentedPostParam {
  postId: number;
  commentId: number;
}

export interface UserReactedPostParam {
  postId: number;
  emojiId: string;
}

export interface UserSharedPostParam {
  postId: number;
}

export interface UserLikedCommentParam {
  commentId: number;
}

export interface UserRepliedCommentParam {
  commentId: number;
}

export interface UserFollowedUserParam {
  followedUserId: number;
}

export interface CustomNotificationParam {
  [key: string]: any;
}
