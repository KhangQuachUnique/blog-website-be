import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserReact } from '../entities/user-react.entity';
import { EmojiSummaryDto, UserReactSummaryDto } from '../dto/response/user-react-summary.dto';

/**
 * 🔍 UserReactQueryService - Handle read operations
 * 
 * 🎯 QUAN TRỌNG: Service này là interface duy nhất để các module khác query reactions
 * 
 * Responsibilities (GRASP - Information Expert):
 * - Aggregate reactions by emoji
 * - Check if current user reacted
 * - Optimize queries với index
 * 
 * Design Principles (Low Coupling):
 * - BlogPostService, CommentService ❌ KHÔNG query trực tiếp bảng user_reacts
 * - ✅ CHỈ gọi qua UserReactQueryService
 * - Dễ cache, dễ optimize sau này
 */
@Injectable()
export class UserReactQueryService {
  constructor(
    @InjectRepository(UserReact)
    private readonly userReactRepo: Repository<UserReact>,
  ) {}

  /**
   * 📊 Lấy reaction summary cho 1 POST
   * 
   * Query tối ưu:
   * - Dùng index IDX_user_react_post
   * - GROUP BY emoji
   * - Single query, không N+1
   * 
   * @param postId - ID của post
   * @param currentUserId - ID của user hiện tại (để check đã react chưa)
   * @returns Summary gồm: emoji, count, isReactedByMe
   */
  async getUserReactForPost(
    postId: number,
    currentUserId?: number,
  ): Promise<UserReactSummaryDto> {
    // Query tất cả reactions của post
    const reactions = await this.userReactRepo
      .createQueryBuilder('react')
      .leftJoinAndSelect('react.emoji', 'emoji')
      .leftJoinAndSelect('emoji.community', 'community')
      .leftJoinAndSelect('react.user', 'user')
      .where('react.post_id = :postId', { postId })
      .orderBy('react.createdAt', 'ASC') // Maintain order
      .getMany();

    return this.aggregateReactions(reactions, 'post', postId, currentUserId);
  }

  /**
   * 📊 Lấy reaction summary cho NHIỀU POSTS (batch query)
   * 
   * Use case: Newsfeed cần reactions của 20 posts
   * → Batch query thay vì N queries
   * 
   * @param postIds - Array các post IDs
   * @param currentUserId - ID của user hiện tại
   * @returns Map<postId, ReactionSummary>
   */
  async getUserReactForPosts(
    postIds: number[],
    currentUserId?: number,
  ): Promise<Map<number, UserReactSummaryDto>> {
    if (postIds.length === 0) {
      return new Map();
    }

    // Single query cho tất cả posts
    const reactions = await this.userReactRepo
      .createQueryBuilder('react')
      .leftJoinAndSelect('react.emoji', 'emoji')
      .leftJoinAndSelect('emoji.community', 'community')
      .leftJoinAndSelect('react.user', 'user')
      .leftJoinAndSelect('react.post', 'post')
      .where('react.post_id IN (:...postIds)', { postIds })
      .orderBy('react.createdAt', 'ASC')
      .getMany();

    // Group by postId
    const reactionsByPost = new Map<number, UserReact[]>();
    reactions.forEach((reaction) => {
      const postId = reaction.post?.id;
      if (!postId) return;

      if (!reactionsByPost.has(postId)) {
        reactionsByPost.set(postId, []);
      }
      reactionsByPost.get(postId)!.push(reaction);
    });

    // Aggregate each post's reactions
    const result = new Map<number, UserReactSummaryDto>();
    postIds.forEach((postId) => {
      const postReactions = reactionsByPost.get(postId) || [];
      result.set(
        postId,
        this.aggregateReactions(postReactions, 'post', postId, currentUserId),
      );
    });

    return result;
  }

  /**
   * 📊 Lấy reaction summary cho 1 COMMENT
   */
  async getUserReactForComment(
    commentId: number,
    currentUserId?: number,
  ): Promise<UserReactSummaryDto> {
    const reactions = await this.userReactRepo
      .createQueryBuilder('react')
      .leftJoinAndSelect('react.emoji', 'emoji')
      .leftJoinAndSelect('emoji.community', 'community')
      .leftJoinAndSelect('react.user', 'user')
      .where('react.comment_id = :commentId', { commentId })
      .orderBy('react.createdAt', 'ASC')
      .getMany();

    return this.aggregateReactions(reactions, 'comment', commentId, currentUserId);
  }

  /**
   * 📊 Lấy reaction summary cho NHIỀU COMMENTS (batch query)
   */
  async getUserReactForComments(
    commentIds: number[],
    currentUserId?: number,
  ): Promise<Map<number, UserReactSummaryDto>> {
    if (commentIds.length === 0) {
      return new Map();
    }

    const reactions = await this.userReactRepo
      .createQueryBuilder('react')
      .leftJoinAndSelect('react.emoji', 'emoji')
      .leftJoinAndSelect('emoji.community', 'community')
      .leftJoinAndSelect('react.user', 'user')
      .leftJoinAndSelect('react.comment', 'comment')
      .where('react.comment_id IN (:...commentIds)', { commentIds })
      .orderBy('react.createdAt', 'ASC')
      .getMany();

    const reactionsByComment = new Map<number, UserReact[]>();
    reactions.forEach((reaction) => {
      const commentId = reaction.comment?.id;
      if (!commentId) return;

      if (!reactionsByComment.has(commentId)) {
        reactionsByComment.set(commentId, []);
      }
      reactionsByComment.get(commentId)!.push(reaction);
    });

    const result = new Map<number, UserReactSummaryDto>();
    commentIds.forEach((commentId) => {
      const commentReactions = reactionsByComment.get(commentId) || [];
      result.set(
        commentId,
        this.aggregateReactions(commentReactions, 'comment', commentId, currentUserId),
      );
    });

    return result;
  }

  /**
   * 🔄 Helper: Aggregate reactions by emoji
   * - Group by emojiId
   * - Count reactions per emoji
   * - Check if currentUser reacted
   * - Maintain order by first appearance
   */
  private aggregateReactions(
    reactions: UserReact[],
    targetType: 'post' | 'comment',
    targetId: number,
    currentUserId?: number,
  ): UserReactSummaryDto {
    const emojiMap = new Map<
      number,
      { dto: EmojiSummaryDto; firstSeenAt: number }
    >();

    reactions.forEach((reaction, index) => {
      const emojiId = reaction.emoji.id;

      if (!emojiMap.has(emojiId)) {
        emojiMap.set(emojiId, {
          dto: {
            emojiId,
            type: reaction.emoji.type,
            codepoint: reaction.emoji.codepoint ?? undefined,
            emojiUrl: reaction.emoji.emojiUrl ?? undefined,
            totalCount: 0,
            reactedByCurrentUser: false,
          },
          firstSeenAt: index,
        });
      }

      const entry = emojiMap.get(emojiId)!;
      entry.dto.totalCount++;

      if (currentUserId && reaction.user.id === currentUserId) {
        entry.dto.reactedByCurrentUser = true;
      }
    });

    // Sort by first appearance (Discord behavior)
    const emojis = Array.from(emojiMap.values())
      .sort((a, b) => a.firstSeenAt - b.firstSeenAt)
      .map((entry) => entry.dto);

    return {
      targetId,
      targetType,
      emojis,
      totalReactions: reactions.length,
    };
  }
}
