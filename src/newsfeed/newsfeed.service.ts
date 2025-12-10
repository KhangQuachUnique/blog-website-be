import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

interface CursorInfo {
  id: number | null;
  score: number | null;
}

/**
 * NewsfeedService (refactored)
 * - Structure and style aligned with BlogPostsService: small private helpers,
 *   clear sequential flow in `getNewsfeed`.
 * - Keeps existing scoring, cursor pagination, hashtag personalization,
 *   viewed-history filtering and DTO mapping.
 */
@Injectable()
export class NewsfeedService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly postRepo: Repository<BlogPost>,
    private readonly viewedHistoryService: ViewedHistoryService,
  ) {}

  /**
   * Public entry point for newsfeed retrieval. High-level, sequential flow:
   * 1. validate & parse cursor
   * 2. compute personalization inputs (hashtags, recent authors/communities)
   * 3. build SQL and params
   * 4. fetch raw rows and hashtags
   * 5. map rows to DTOs and paginate
   */
  async getNewsfeed(
    dto: GetNewsfeedDto,
    user?: { id: number; username?: string },
  ): Promise<{ status: string; data: GetNewsfeedResponseDto }> {
    const { limit = 15, after } = dto;

    // 1) Parse cursor
    const cursor = this.parseCursor(after);

    // 2) Personalization sources
    const interestedTags = user?.id ? await this.getInterestedTags(user.id) : [];
    const { recentAuthors, recentCommunities } =
      user?.id && cursor.score !== null
        ? await this.getRecentDiversity(user.id, cursor.id)
        : { recentAuthors: [], recentCommunities: [] };

    // 3) Build SQL and parameter list
    const params: unknown[] = [];
    const parts = this.buildPersonalizationParts(
      params,
      interestedTags,
      user?.id,
      recentAuthors,
      recentCommunities,
    );

    const cursorWhere = this.buildCursorWhere(cursor, params);
    params.push(limit + 1);

    const query = this.buildMainQuery(parts, cursorWhere, params.length);

    // 4) Fetch raw posts
    const rawPosts: RawPostRow[] = await this.postRepo.query(query, params);

    // 5) Fetch hashtags for posts
    const postIds = rawPosts.map((p) => Number(p.id));
    const hashtagsMap = await this.fetchHashtagsForPosts(postIds);

    // 5.1) Load posts with votes relation to use BlogPost.getVotes()
    let votesMap: Record<number, { upvotes: number; downvotes: number; userVote: any }> = {};
    if (postIds.length > 0) {
      try {
        const postsWithVotes = await this.postRepo.find({
          where: { id: In(postIds) },
          relations: ['votes', 'votes.user'],
        });
        for (const postEntity of postsWithVotes) {
          // pass 0 if no user provided; getVotes expects a userId number
          const v = postEntity.getVotes(user?.id ?? 0);
          votesMap[Number(postEntity.id)] = { upvotes: v.upvotes, downvotes: v.downvotes, userVote: v.userVote };
        }
      } catch {
        votesMap = {};
      }
    }

    // 6) Get viewed ids (for marking viewed client-side)
    const viewedIds = user?.id ? await this.getViewedIds(user.id) : [];

    // 7) Map to DTOs (use votesMap built from BlogPost.getVotes)
    const items = this.mapRowsToDto(rawPosts, hashtagsMap, viewedIds, votesMap);

    // 8) Paginate and return
    const { paginatedItems, hasMore, nextCursor } = this.paginate(items, limit);

    return {
      status: 'success',
      data: { items: paginatedItems, pagination: { hasMore, nextCursor } },
    };
  }

  /* ========================= PRIVATE HELPERS ========================= */

  // Parse base64 cursor encoded as "<id>|<score>" -> CursorInfo
  private parseCursor(after?: string | null): CursorInfo {
    if (!after) return { id: null, score: null };
    try {
      const [idStr, scoreStr] = Buffer.from(after, 'base64').toString('utf-8').split('|');
      return { id: Number(idStr) || null, score: Number(scoreStr) || null };
    } catch {
      return { id: null, score: null };
    }
  }

  // Get user's top hashtags for personalization
  private async getInterestedTags(userId: number): Promise<string[]> {
    try {
      const top = await this.viewedHistoryService.getTopHashtags(userId, 25, 14);
      return top.map((t) => t.name);
    } catch {
      return [];
    }
  }

  // Get recent authors and communities for simple diversity heuristics
  private async getRecentDiversity(userId: number, cursorId: number | null) {
    const recentAuthors: number[] = [];
    const recentCommunities: number[] = [];
    if (!cursorId) return { recentAuthors, recentCommunities };

    const recentQuery = `
      SELECT DISTINCT p."authorId" as "authorId", p."communityId" as "communityId"
      FROM blog_posts p
      WHERE p.id > $1
      ORDER BY p.id DESC
      LIMIT 5
    `;
    const recent = await this.postRepo.query(recentQuery, [cursorId || 0]);
    recentAuthors.push(...recent.map((r: any) => Number(r.authorId)).filter(Boolean));
    recentCommunities.push(...recent.map((r: any) => Number(r.communityId)).filter(Boolean));
    return { recentAuthors, recentCommunities };
  }

  /**
   * Build personalization SQL snippets and append needed parameters.
   * Returns textual SQL pieces to be injected into main query and the mutated params array.
   */
  private buildPersonalizationParts(
    params: unknown[],
    interestedTags: string[],
    userId?: number,
    recentAuthors: number[] = [],
    recentCommunities: number[] = [],
  ) {
    // Tag bonus
    let tagBonus = '0';
    if (interestedTags.length > 0) {
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

    // Follow bonus
    let followBonus = '0';
    if (userId) {
      followBonus = `
        COALESCE((
          SELECT 15 * (1 + 0.3 * (EXTRACT(EPOCH FROM (NOW() - f."createdAt")) / 86400 < 7)::int)
          FROM user_follows f 
          WHERE f."userId" = $${params.length + 1} 
            AND f."followingId" = p."authorId"
        ), 0)
      `;
      params.push(userId);
    }

    // Viewed penalty and is_viewed check
    let viewedPenalty = '0';
    let isViewedCheck = 'false';
    if (userId) {
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
      params.push(userId);

      // reuse the same param index for existence check
      const userParamIndex = params.length; // 1-based index in $n
      isViewedCheck = `EXISTS(
        SELECT 1 FROM viewed_history vh 
        WHERE vh."userId" = $${userParamIndex}
          AND vh."postId" = p.id
      )`;
    }

    // Diversity penalty
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
      diversityPenalty = `CASE WHEN ${conditions.join(' OR ')} THEN -8 ELSE 0 END`;
    }

    return { tagBonus, followBonus, viewedPenalty, isViewedCheck, diversityPenalty };
  }

  // Build main SQL query using personalization parts. 'limitParamIndex' is 1-based index where LIMIT will be ($n)
  private buildMainQuery(
    parts: {
      tagBonus: string;
      followBonus: string;
      viewedPenalty: string;
      isViewedCheck: string;
      diversityPenalty: string;
    },
    cursorWhere: string,
    limitParamIndex: number,
  ) {
    const { tagBonus, followBonus, viewedPenalty, isViewedCheck, diversityPenalty } = parts;

    return `
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
          (
            10 * LN(1 + GREATEST(0, COALESCE(v.up_votes, 0) - COALESCE(v.down_votes, 0)) + COALESCE(r.reacts, 0) * 1.5 + COALESCE(cm.comments, 0) * 2.5)
            + CASE WHEN COALESCE(views.views, 0) > 10 THEN 5 * (COALESCE(cm.comments, 0)::float / COALESCE(views.views, 1)) ELSE 0 END
            + 15 / (1 + POWER(GREATEST(0.01, (EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 3600) / 24), 1.5))
            + ${tagBonus}
            + ${followBonus}
            + ${viewedPenalty}
            + ${diversityPenalty}
            + CASE WHEN (COALESCE(v.up_votes, 0) + COALESCE(r.reacts, 0) + COALESCE(cm.comments, 0)) > 50 THEN 8 WHEN (COALESCE(v.up_votes, 0) + COALESCE(r.reacts, 0) + COALESCE(cm.comments, 0)) > 20 THEN 5 ELSE 0 END
          ) AS score,
          ${isViewedCheck} as is_viewed,
          CASE WHEN COALESCE(views.views, 0) > 0 THEN (COALESCE(cm.comments, 0)::float / COALESCE(views.views, 1)) * 100 ELSE 0 END as engagement_rate
        FROM blog_posts p
        LEFT JOIN users u ON u.id = p."authorId"
        LEFT JOIN (
          SELECT "postId", COUNT(*)::int AS reacts FROM user_reacts GROUP BY "postId"
        ) r ON r."postId" = p.id
        LEFT JOIN (
          SELECT "postId", COUNT(*)::int AS comments FROM comments GROUP BY "postId"
        ) cm ON cm."postId" = p.id
        LEFT JOIN (
          SELECT "postId",
            SUM(CASE WHEN LOWER("voteType"::text) = 'upvote' THEN 1 ELSE 0 END)::int as up_votes,
            SUM(CASE WHEN LOWER("voteType"::text) = 'downvote' THEN 1 ELSE 0 END)::int as down_votes
          FROM user_votes GROUP BY "postId"
        ) v ON v."postId" = p.id
        LEFT JOIN (
          SELECT "postId", COUNT(DISTINCT "userId")::int as views FROM viewed_history GROUP BY "postId"
        ) views ON views."postId" = p.id
        LEFT JOIN community comm ON comm.id = p."communityId"
        WHERE p."isPublic" = true 
          AND p.status = 'ACTIVE'
          AND p."createdAt" <= NOW()
          AND p."createdAt" > NOW() - INTERVAL '30 days'
      )
      SELECT * FROM ranked
      ${cursorWhere}
      ORDER BY score DESC, id DESC
      LIMIT $${limitParamIndex}
    `;
  }

  // Build cursor WHERE clause and push cursor params into params array
  private buildCursorWhere(cursor: CursorInfo, params: unknown[]) {
    if (cursor.score !== null && cursor.id !== null) {
      params.push(cursor.score, cursor.id);
      const index = params.length - 1; // score param index (0-based), but used only for ordering here
      // The SQL uses the $n placeholders created earlier when building parts.
      return `WHERE score < $${index} OR (score = $${index} AND id < $${index + 1})`;
    }
    return '';
  }

  // Fetch hashtags for a list of posts and return a map postId -> hashtag[]
  private async fetchHashtagsForPosts(postIds: number[]) {
    if (postIds.length === 0) return {} as Record<string, { id: number; name: string }[]>;
    const hashtagsQuery = `
      SELECT ph."postId" as post_id, h.id, h.name
      FROM post_hashtags ph
      JOIN hashtags h ON h.id = ph."hashtagId"
      WHERE ph."postId" = ANY($1::bigint[])
      ORDER BY ph."postId", h.name
    `;
    const hashtagsResult: { post_id: number; id: number; name: string }[] = await this.postRepo.query(
      hashtagsQuery,
      [postIds],
    );

    return hashtagsResult.reduce((acc, row) => {
      const postId = String(row.post_id);
      if (!acc[postId]) acc[postId] = [];
      acc[postId].push({ id: Number(row.id), name: row.name });
      return acc;
    }, {} as Record<string, { id: number; name: string }[]>);
  }

  // Get viewed post ids within last 30 days for marking
  private async getViewedIds(userId: number) {
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return await this.viewedHistoryService.getViewedPostIds(userId, since);
    } catch {
      return [];
    }
  }

  // Map raw DB rows to `NewsfeedItemDto` instances
  private mapRowsToDto(
    rawPosts: RawPostRow[],
    hashtagsMap: Record<string, { id: number; name: string }[]>,
    viewedIds: number[],
    votesMap: Record<number, { upvotes: number; downvotes: number; userVote: any }>,
  ): NewsfeedItemDto[] {
    return rawPosts.map((p) => {
      const pid = Number(p.id);
      const v = votesMap[pid];
      const up = v ? Number(v.upvotes ?? 0) : Number(p.up_votes ?? 0);
      const down = v ? Number(v.downvotes ?? 0) : Number(p.down_votes ?? 0);
      return {
        id: pid,
        title: p.title || 'Untitled',
        thumbnailUrl: p.thumbnail_url || null,
        upVotes: up,
        downVotes: down,
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
        isViewed: Boolean(p.is_viewed) || viewedIds.includes(pid),
        totalReacts: Number(p.total_reacts ?? 0),
        totalComments: Number(p.total_comments ?? 0),
        engagementRate: Number(p.engagement_rate ?? 0),
      };
    });
  }

  // Cursor-based pagination: returns paginated items, hasMore flag and nextCursor
  private paginate(items: NewsfeedItemDto[], limit: number) {
    const hasMore = items.length > limit;
    const paginatedItems = hasMore ? items.slice(0, limit) : items;
    const lastItem = paginatedItems[paginatedItems.length - 1];
    const nextCursor = hasMore && lastItem ? Buffer.from(`${lastItem.id}|${(lastItem as any).final_score}`).toString('base64') : null;
    return { paginatedItems, hasMore, nextCursor };
  }

  // Optional: retained helper from previous implementation for quality scoring
  private calculateQualityScore(
    upVotes: number,
    downVotes: number,
    reacts: number,
    comments: number,
  ): number {
    const n = upVotes + downVotes;
    if (n === 0) return 0;
    const z = 1.96;
    const phat = upVotes / n;
    return (
      (phat + (z * z) / (2 * n) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n)) /
      (1 + (z * z) / n)
    );
  }
}
