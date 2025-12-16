import { UserReact } from '../../user-reacts/entities/user-react.entity';
import { User } from '../../users/entities/user.entity';
import { BlogPost } from '../../blog-posts/entities/blog-post.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Emoji } from '../../emojis/entities/emoji.entity';

export class UserReactFactory {
  static createPostReact(user: User, post: BlogPost, emoji: Emoji): UserReact {
    const react = new UserReact();
    react.user = user;
    react.post = post;
    react.emoji = emoji;
    react.comment = null;
    return react;
  }

  static createCommentReact(user: User, comment: Comment, emoji: Emoji): UserReact {
    const react = new UserReact();
    react.user = user;
    react.post = null;
    react.comment = comment;
    react.emoji = emoji;
    return react;
  }

  static createPostReactBatch(
    users: User[],
    post: BlogPost,
    emojis: Emoji[],
    count: number,
  ): UserReact[] {
    const reacts: UserReact[] = [];
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
    users: User[],
    comment: Comment,
    emojis: Emoji[],
    count: number,
  ): UserReact[] {
    const reacts: UserReact[] = [];
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
