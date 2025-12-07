// src/newsfeed/newsfeed.service.ts
// ✅ Improved algorithm with better scoring, diversity, and performance

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from '../blog-posts/entities/blog-post.entity';
import { GetNewsfeedDto, GetNewsfeedResponseDto, NewsfeedItemDto } from './dto';
import { ViewedHistoryService } from '../viewed-history/viewed-history.service';

type RawPostRow = {
  id: number | string;
  title?: string | null;
  post_type?: string | null;
  thumbnail_url?: string | null;
  up_votes?: number | string | null;
  down_votes?: number | string | null;
  created_at?: string | Date | null;
  username?: string | null;
  avatar_url?: string | null;
  total_reacts?: number | string | null;
  total_comments?: number | string | null;
  community_id?: number | string | null;
  community_name?: string | null;
  community_thumbnail?: string | null;
  score?: number | string | null;
  is_viewed?: boolean | null;
  author_id?: number | string | null;
  engagement_rate?: number | string | null;
  views_count?: number | string | null;
};

@Injectable()
export class NewsfeedService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly postRepo: Repository<BlogPost>,
    private readonly viewedHistoryService: ViewedHistoryService,
  ) {}

  async getNewsfeed(
    dto: GetNewsfeedDto,
    user?: { id: number; username?: string },
  ): Promise<{ status: string; data: GetNewsfeedResponseDto }> {
    const { limit = 15, after } = dto;

    // === Cursor parsing ===
    let cursorScore: number | null = null;
    let cursorId: number | null = null;
    if (after) {
      try {
        const [idStr, scoreStr] = Buffer.from(after, 'base64').toString('utf-8').split('|');
        cursorId = Number(idStr);
        cursorScore = Number(scoreStr);
      } catch {
        cursorId = null;
        cursorScore = null;
      }
    }

    // === Get user interests (hashtags) ===
    let interestedTags: string[] = [];
    if (user?.id) {
      const top = await this.viewedHistoryService.getTopHashtags(user.id, 25, 14);
      interestedTags = top.map((t) => t.name);
    }

    // === Get recently shown authors/communities for diversity ===
    let recentAuthors: number[] = [];
    let recentCommunities: number[] = [];
    if (user?.id && cursorScore !== null) {
      // Get recent 5 posts to avoid repetition
      const recentQuery = `
        SELECT DISTINCT p."authorId", p."communityId"
        FROM blog_posts p
        WHERE p.id > $1
        ORDER BY p.id DESC
        LIMIT 5
      `;
      const recent = await this.postRepo.query(recentQuery, [cursorId || 0]);
      recentAuthors = recent.map((r: any) => Number(r.authorId)).filter(Boolean);
      recentCommunities = recent.map((r: any) => Number(r.communityId)).filter(Boolean);
    }

    // === Build query params ===
    const params: unknown[] = [];

    // 🎯 IMPROVED: Hashtag scoring with diminishing returns
    let tagBonus = '0';
    if (interestedTags.length > 0) {
      // Use LOG to prevent over-weighting posts with many matching tags
      tagBonus = `
        (SELECT 
          CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE 12 * LN(COUNT(*) + 1)
          END
        FROM post_hashtags ph 
        JOIN hashtags h ON h.id = ph."hashtagId" 
        WHERE ph."postId" = p.id 
          AND h.name = ANY($${params.length + 1}::text[])
        )
      `;
      params.push(interestedTags);
    }

    // 🎯 IMPROVED: Follow bonus with recency factor
    let followBonus = '0';
    if (user?.id) {
      followBonus = `
        COALESCE((
          SELECT 15 * (1 + 0.3 * (EXTRACT(EPOCH FROM (NOW() - f."createdAt")) / 86400 < 7)::int)
          FROM user_follows f 
          WHERE f."userId" = $${params.length + 1} 
            AND f."followingId" = p."authorId"
        ), 0)
      `;
      params.push(user.id);
    }

    // 🎯 IMPROVED: Softer view penalty with exponential decay
    let viewedPenalty = '0';
    let isViewedCheck = 'false';
    if (user?.id) {
      viewedPenalty = `
        COALESCE((
          SELECT 
            -20 * EXP(-0.1 * (EXTRACT(EPOCH FROM (NOW() - vh."createdAt")) / 86400))
          FROM viewed_history vh 
          WHERE vh."userId" = $${params.length + 1} 
            AND vh."postId" = p.id
          LIMIT 1
        ), 0)
      `;
      params.push(user.id);

      isViewedCheck = `EXISTS(
        SELECT 1 FROM viewed_history vh 
        WHERE vh."userId" = $${params.indexOf(user.id) + 1} 
          AND vh."postId" = p.id
      )`;
    }

    // 🎯 IMPROVED: Diversity penalty
    let diversityPenalty = '0';
    if (recentAuthors.length > 0 || recentCommunities.length > 0) {
      const conditions: string[] = [];
      if (recentAuthors.length > 0) {
        conditions.push(`p."authorId" = ANY($${params.length + 1}::bigint[])`);
        params.push(recentAuthors);
      }
      if (recentCommunities.length > 0) {
        conditions.push(`p."communityId" = ANY($${params.length + 1}::bigint[])`);
        params.push(recentCommunities);
      }
      diversityPenalty = `
        CASE 
          WHEN ${conditions.join(' OR ')} THEN -8
          ELSE 0
        END
      `;
    }

    // === Get viewed post IDs for UI marking ===
    let viewedIds: number[] = [];
    if (user?.id) {
      try {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        viewedIds = await this.viewedHistoryService.getViewedPostIds(user.id, since);
      } catch {
        viewedIds = [];
      }
    }

    // === Cursor condition ===
    let cursorWhere = '';
    if (cursorScore !== null && cursorId !== null) {
      cursorWhere = `
        WHERE score < $${params.length + 1} 
          OR (score = $${params.length + 1} AND id < $${params.length + 2})
      `;
      params.push(cursorScore, cursorId);
    }

    // 🎯 IMPROVED: Main query with better scoring formula
    const query = `
      WITH ranked AS (
        SELECT 
          p.id,
          p.title,
          p.type as post_type,
          p."thumbnailUrl" as thumbnail_url,
          p."createdAt" as created_at,
          p."authorId" as author_id,
          u.username,
          u."avatarUrl" as avatar_url,
          COALESCE(r.reacts, 0)::int as total_reacts,
          COALESCE(cm.comments, 0)::int as total_comments,
          COALESCE(v.up_votes, 0)::int as up_votes,
          COALESCE(v.down_votes, 0)::int as down_votes,
          COALESCE(views.views, 0)::int as views_count,
          comm.id as community_id,
          comm.name as community_name,
          comm."thumbnailUrl" as community_thumbnail,
          
          -- 🎯 IMPROVED SCORING FORMULA
          (
            -- Base engagement score with logarithmic scaling
            10 * LN(
              1 + 
              GREATEST(0, COALESCE(v.up_votes, 0) - COALESCE(v.down_votes, 0)) +
              COALESCE(r.reacts, 0) * 1.5 +
              COALESCE(cm.comments, 0) * 2.5
            )
            
            -- Engagement rate bonus (comments/views ratio)
            + CASE 
                WHEN COALESCE(views.views, 0) > 10 THEN
                  5 * (COALESCE(cm.comments, 0)::float / COALESCE(views.views, 1))
                ELSE 0
              END
            
            -- Time decay with power law (safe for future dates)
            + 15 / (1 + POWER(GREATEST(0.01, (EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 3600) / 24), 1.5))
            
            -- Personalization signals
            + ${tagBonus}
            + ${followBonus}
            + ${viewedPenalty}
            + ${diversityPenalty}
            
            -- Quality boost for high engagement posts
            + CASE 
                WHEN (COALESCE(v.up_votes, 0) + COALESCE(r.reacts, 0) + COALESCE(cm.comments, 0)) > 50 
                THEN 8
                WHEN (COALESCE(v.up_votes, 0) + COALESCE(r.reacts, 0) + COALESCE(cm.comments, 0)) > 20 
                THEN 5
                ELSE 0
              END
              
          ) AS score,
          
          ${isViewedCheck} as is_viewed,
          
          -- Engagement rate for client-side use
          CASE 
            WHEN COALESCE(views.views, 0) > 0 THEN
              (COALESCE(cm.comments, 0)::float / COALESCE(views.views, 1)) * 100
            ELSE 0
          END as engagement_rate
          
        FROM blog_posts p
        LEFT JOIN users u ON u.id = p."authorId"
        LEFT JOIN (
          SELECT "postId", COUNT(*)::int AS reacts 
          FROM user_reacts 
          GROUP BY "postId"
        ) r ON r."postId" = p.id
        LEFT JOIN (
          SELECT "postId", COUNT(*)::int AS comments 
          FROM comments 
          GROUP BY "postId"
        ) cm ON cm."postId" = p.id
        LEFT JOIN (
          SELECT "postId",
            SUM(CASE WHEN LOWER("voteType"::text) = 'upvote' THEN 1 ELSE 0 END)::int as up_votes,
            SUM(CASE WHEN LOWER("voteType"::text) = 'downvote' THEN 1 ELSE 0 END)::int as down_votes
          FROM user_votes 
          GROUP BY "postId"
        ) v ON v."postId" = p.id
        LEFT JOIN (
          SELECT "postId", COUNT(DISTINCT "userId")::int as views
          FROM viewed_history
          GROUP BY "postId"
        ) views ON views."postId" = p.id
        LEFT JOIN community comm ON comm.id = p."communityId"
        WHERE p."isPublic" = true 
          AND p.status = 'ACTIVE'
          AND p."createdAt" <= NOW()  -- No future posts
          AND p."createdAt" > NOW() - INTERVAL '30 days'  -- Focus on recent content
      )
      SELECT *
      FROM ranked
      ${cursorWhere}
      ORDER BY score DESC, id DESC
      LIMIT $${params.length + 1}
    `;

    params.push(limit + 1);

    const rawPosts: RawPostRow[] = await this.postRepo.query(query, params);

    // === Get hashtags for all posts ===
    const postIds: number[] = rawPosts.map((p) => Number(p.id));
    let hashtagsMap: Record<string, { id: number; name: string }[]> = {};

    if (postIds.length > 0) {
      const hashtagsQuery = `
        SELECT 
          ph."postId" as post_id,
          h.id,
          h.name
        FROM post_hashtags ph
        JOIN hashtags h ON h.id = ph."hashtagId"
        WHERE ph."postId" = ANY($1::bigint[])
        ORDER BY ph."postId", h.name
      `;
      const hashtagsResult: { post_id: number; id: number; name: string }[] = 
        await this.postRepo.query(hashtagsQuery, [postIds]);
      
      hashtagsMap = hashtagsResult.reduce(
        (acc, row) => {
          const postId = String(row.post_id);
          if (!acc[postId]) acc[postId] = [];
          acc[postId].push({ id: Number(row.id), name: row.name });
          return acc;
        },
        {} as Record<string, { id: number; name: string }[]>,
      );
    }

    // === Map to DTO ===
    const posts: NewsfeedItemDto[] = rawPosts.map((p) => ({
      id: Number(p.id),
      title: p.title || 'Untitled',
      thumbnailUrl: p.thumbnail_url || null,
      upVotes: Number(p.up_votes ?? 0),
      downVotes: Number(p.down_votes ?? 0),
      createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
      author: {
        id: p.author_id ? Number(p.author_id) : 0,
        username: p.username || 'Anonymous',
        avatarUrl: p.avatar_url || null,
      },
      community: p.community_id
        ? {
            id: Number(p.community_id),
            name: p.community_name || '',
            thumbnailUrl: p.community_thumbnail || null,
          }
        : null,
      hashtags: hashtagsMap[String(p.id)] || [],
      final_score: Number(p.score ?? 0),
      isViewed: Boolean(p.is_viewed) || viewedIds.includes(Number(p.id)),
      totalReacts: Number(p.total_reacts ?? 0),
      totalComments: Number(p.total_comments ?? 0),
      engagementRate: Number(p.engagement_rate ?? 0),
    }));

    // === Pagination ===
    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const lastItem = items[items.length - 1];

    const nextCursor =
      hasMore && lastItem
        ? Buffer.from(`${lastItem.id}|${(lastItem as any).final_score}`).toString('base64')
        : null;

    return {
      status: 'success',
      data: {
        items,
        pagination: { hasMore, nextCursor },
      },
    };
  }

  // 🎯 NEW: Helper method to get post quality score
  private calculateQualityScore(
    upVotes: number,
    downVotes: number,
    reacts: number,
    comments: number,
  ): number {
    // Wilson score confidence interval for binary rating
    const n = upVotes + downVotes;
    if (n === 0) return 0;

    const z = 1.96; // 95% confidence
    const phat = upVotes / n;
    return (
      (phat + (z * z) / (2 * n) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n)) /
      (1 + (z * z) / n)
    );
  }
}