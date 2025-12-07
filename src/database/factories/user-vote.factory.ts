import { UserVote, EVoteType } from '../../user-votes/entities/user-vote.entity';
import { User } from '../../users/entities/user.entity';
import { BlogPost } from '../../blog-posts/entities/blog-post.entity';

export class UserVoteFactory {
  static create(user: User, post: BlogPost, override: Partial<UserVote> = {}): UserVote {
    const vote = new UserVote();

    // Randomly pick upvote or downvote (70% upvote)
    vote.voteType =
      override.voteType || (Math.random() > 0.3 ? EVoteType.UPVOTE : EVoteType.DOWNVOTE);

    vote.user = user;
    vote.post = post;
    vote.createdAt = override.createdAt || new Date();

    return vote;
  }

  static createBatch(users: User[], post: BlogPost, count: number): UserVote[] {
    const votes: UserVote[] = [];
    const usedUsers = new Set<number>();

    // Ensure no duplicate votes from same user on same post
    for (let i = 0; i < count && i < users.length; i++) {
      let user: User;
      let attempts = 0;

      do {
        user = users[Math.floor(Math.random() * users.length)];
        attempts++;
      } while (usedUsers.has(user.id) && attempts < 10);

      if (!usedUsers.has(user.id)) {
        votes.push(this.create(user, post));
        usedUsers.add(user.id);
      }
    }

    return votes;
  }
}
