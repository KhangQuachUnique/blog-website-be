import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserVote, EVoteType } from './entities/user-vote.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { User } from 'src/users/entities/user.entity';
import { VoteResponseDto } from './dto/response/vote-response.dto';

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
   * Helper: Tính upVotes/downVotes từ votes array
   */
  private getVoteCounts(votes: UserVote[]) {
    const upVotes = votes.filter((v) => v.voteType === EVoteType.UPVOTE).length;
    const downVotes = votes.filter((v) => v.voteType === EVoteType.DOWNVOTE).length;
    return { upVotes, downVotes };
  }

  /**
   * Vote hoặc thay đổi vote cho bài viết - Optimized with transaction
   */
  async vote(userId: number, postId: number, voteType: EVoteType) {
    // Use a transaction to batch all DB operations
    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOneBy(User, { id: userId });
      if (!user) throw new NotFoundException('User not found');

      // Lock the post without loading votes relation (to avoid LEFT JOIN + FOR UPDATE conflict)
      const post = await manager.findOne(BlogPost, {
        where: { id: postId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!post) throw new NotFoundException('Post not found');

      // Load votes separately after locking the post
      const votes = await manager.find(UserVote, {
        where: { post: { id: postId } },
      });

      // Tìm vote hiện tại của user
      const existingVote = await manager.findOne(UserVote, {
        where: { user: { id: userId }, post: { id: postId } },
      });

      if (existingVote) {
        // Nếu vote cùng loại -> xóa vote (toggle off)
        if (existingVote.voteType === voteType) {
          await manager.remove(existingVote);
          const updatedVotes = votes.filter((v) => v.id !== existingVote.id);
          const { upVotes, downVotes } = this.getVoteCounts(updatedVotes);
          return {
            message: 'Vote removed',
            voteType: null,
            upVotes,
            downVotes,
          };
        }

        // Nếu vote khác loại -> đổi vote
        existingVote.voteType = voteType;
        await manager.save(existingVote);
        const { upVotes, downVotes } = this.getVoteCounts(
          votes.map((v) => (v.id === existingVote.id ? existingVote : v)),
        );
        return {
          message: 'Vote changed',
          voteType,
          upVotes,
          downVotes,
        };
      }

      // Tạo vote mới
      const newVote = manager.create(UserVote, {
        user,
        post,
        voteType,
      });
      await manager.save(newVote);

      const updatedVotes = [...votes, newVote];
      const { upVotes, downVotes } = this.getVoteCounts(updatedVotes);

      return {
        message: 'Vote added',
        voteType,
        upVotes,
        downVotes,
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

  /**
   * Hàm lấy tổng số upvotes, downvotes và userVote cho bài viết
   * @param postId
   * @returns
   */
  async getPostVotes(postId: number, userId?: number): Promise<VoteResponseDto> {
    const votes = await this.voteRepository.find({
      where: { post: { id: postId } },
      relations: ['user'],
    });
    const upvotes = votes.filter((vote) => vote.voteType === EVoteType.UPVOTE).length;
    const downvotes = votes.filter((vote) => vote.voteType === EVoteType.DOWNVOTE).length;
    // Tìm vote của user (nếu có)
    const userVote = votes.find((vote) => vote.user.id === userId)?.voteType || null;
    return { upvotes, downvotes, userVote: userVote };
  }

  /**
   * Lấy votes cho NHIỀU bài viết
   */
  async getPostsVotes(postIds: number[], userId?: number): Promise<Map<number, VoteResponseDto>> {
    // GUARD case: Nếu không có postIds thì trả về Map rỗng ngay
    if (!postIds.length) {
      return new Map();
    }

    const votes = await this.voteRepository
      .createQueryBuilder('vote')
      .leftJoinAndSelect('vote.user', 'user')
      .leftJoinAndSelect('vote.post', 'post')
      .where('vote.postId IN (:...postIds)', { postIds })
      .getMany();

    // Group votes by postId
    const votesByPost = new Map<number, UserVote[]>();
    votes.forEach((vote) => {
      const postId = vote.post.id;
      if (!votesByPost.has(postId)) {
        votesByPost.set(postId, []);
      }
      votesByPost.get(postId)!.push(vote);
    });

    // anonymous case
    const result = new Map<number, VoteResponseDto>();
    if (!userId) {
      for (const postId of postIds) {
        const postVotes = votesByPost.get(postId) || [];
        result.set(postId, {
          upvotes: postVotes.filter((v) => v.voteType === EVoteType.UPVOTE).length,
          downvotes: postVotes.filter((v) => v.voteType === EVoteType.DOWNVOTE).length,
          userVote: null,
        });
      }
      return result;
    }

    // logged-in user case
    postIds.forEach((postId) => {
      const postVotes = votesByPost.get(postId) || [];
      const upvotes = postVotes.filter((vote) => vote.voteType === EVoteType.UPVOTE).length;
      const downvotes = postVotes.filter((vote) => vote.voteType === EVoteType.DOWNVOTE).length;
      const userVote = postVotes.find((vote) => vote.user.id === userId)?.voteType || null;
      result.set(postId, { upvotes, downvotes, userVote });
    });
    return result;
  }
}
