export class CommentUserDto {
  id: number;
  username: string;
  avatarUrl?: string;
}

export class ChildCommentResponseDto {
  id: number;
  content: string;
  createAt: Date;
  commentUser: CommentUserDto;
  replyToUser?: CommentUserDto;
}

export class CommentResponseDto {
  id: number;
  content: string;
  type: string;
  createAt: Date;
  commenter: CommentUserDto;
  childComments: ChildCommentResponseDto[];
  childCommentsCount: number;
}

export class CommentListResponseDto {
  comments: CommentResponseDto[];
  totalCount: number;
  sortBy: 'newest' | 'interactions';
}