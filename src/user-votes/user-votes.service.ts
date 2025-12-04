import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserVote, EVoteType } from './entities/user-vote.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class UserVotesService {
  constructor(
    @InjectRepository(UserVote)
    private voteRepository: Repository<UserVote>,
    @InjectRepository(BlogPost)
    private postRepository: Repository<BlogPost>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  /**
   * Vote hoặc thay đổi vote cho bài viết - Optimized with transaction
   */
  async vote(userId: number, postId: number, voteType: EVoteType) {
    // Use a transaction to batch all DB operations
    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOneBy(User, { id: userId });
      if (!user) throw new NotFoundException('User not found');

      const post = await manager.findOneBy(BlogPost, { id: postId });
      if (!post) throw new NotFoundException('Post not found');

      // Tìm vote hiện tại của user
      const existingVote = await manager.findOne(UserVote, {
        where: { user: { id: userId }, post: { id: postId } },
      });

      if (existingVote) {
        // Nếu vote cùng loại -> xóa vote (toggle off)
        if (existingVote.voteType === voteType) {
          await manager.remove(existingVote);
          // Cập nhật count
          if (voteType === EVoteType.UPVOTE) {
            post.upVotes = Math.max(0, post.upVotes - 1);
          } else {
            post.downVotes = Math.max(0, post.downVotes - 1);
          }
          await manager.save(post);
          return {
            message: 'Vote removed',
            voteType: null,
            upVotes: post.upVotes,
            downVotes: post.downVotes,
          };
        }

        // Nếu vote khác loại -> đổi vote
        const oldVoteType = existingVote.voteType;
        existingVote.voteType = voteType;
        await manager.save(existingVote);

        // Cập nhật count
        if (oldVoteType === EVoteType.UPVOTE) {
          post.upVotes = Math.max(0, post.upVotes - 1);
          post.downVotes += 1;
        } else {
          post.downVotes = Math.max(0, post.downVotes - 1);
          post.upVotes += 1;
        }
        await manager.save(post);
        return {
          message: 'Vote changed',
          voteType,
          upVotes: post.upVotes,
          downVotes: post.downVotes,
        };
      }

      // Tạo vote mới
      const newVote = manager.create(UserVote, {
        user,
        post,
        voteType,
      });
      await manager.save(newVote);

      // Cập nhật count
      if (voteType === EVoteType.UPVOTE) {
        post.upVotes += 1;
      } else {
        post.downVotes += 1;
      }
      await manager.save(post);

      return {
        message: 'Vote added',
        voteType,
        upVotes: post.upVotes,
        downVotes: post.downVotes,
      };
    });
  }

  /**
   * Lấy vote status của user cho post
   */
  async getVoteStatus(userId: number, postId: number) {
    const vote = await this.voteRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });
    return { voteType: vote?.voteType || null };
  }
}
