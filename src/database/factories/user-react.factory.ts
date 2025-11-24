import { PostUserReact } from '../../user-reacts/entities/post-user-react.entity';
import { CommentUserReact } from '../../user-reacts/entities/comment-user-react.entity';
import { NormalUser } from '../../users/entities/normal-user.entity';
import { BlogPost } from '../../blog-posts/entities/blog-post.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Emoji } from '../../emojis/entities/emoji.entity';

export class UserReactFactory {
  static createPostReact(user: NormalUser, post: BlogPost, emoji: Emoji): PostUserReact {
    const react = new PostUserReact();
    react.user = user;
    react.post = post;
    react.emoji = emoji;
    return react;
  }

  static createCommentReact(user: NormalUser, comment: Comment, emoji: Emoji): CommentUserReact {
    const react = new CommentUserReact();
    react.user = user;
    react.comment = comment;
    react.emoji = emoji;
    return react;
  }

  static createPostReactBatch(
    users: NormalUser[],
    post: BlogPost,
    emojis: Emoji[],
    count: number,
  ): PostUserReact[] {
    const reacts: PostUserReact[] = [];
    const usedUsers = new Set<number>();

    for (let i = 0; i < count && i < users.length; i++) {
      const user = users[i];
      if (!usedUsers.has(user.id)) {
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        reacts.push(this.createPostReact(user, post, randomEmoji));
        usedUsers.add(user.id);
      }
    }

    return reacts;
  }

  static createCommentReactBatch(
    users: NormalUser[],
    comment: Comment,
    emojis: Emoji[],
    count: number,
  ): CommentUserReact[] {
    const reacts: CommentUserReact[] = [];
    const usedUsers = new Set<number>();

    for (let i = 0; i < count && i < users.length; i++) {
      const user = users[i];
      if (!usedUsers.has(user.id)) {
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        reacts.push(this.createCommentReact(user, comment, randomEmoji));
        usedUsers.add(user.id);
      }
    }

    return reacts;
  }
}
