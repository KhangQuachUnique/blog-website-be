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
 * NewsfeedService with Interleave Ranking Algorithm
 * - 70% Personalized posts
 * - 20% Trending posts
 * - 10% Random community posts
 */
@Injectable()
export class NewsfeedService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly postRepo: Repository<BlogPost>,
    private readonly viewedHistoryService: ViewedHistoryService,
  ) {}

  /**
   * Main entry point - uses interleave ranking algorithm
   */
  async getNewsfeed(
    dto: GetNewsfeedDto,
    user?: { id: number; username?: string },
  ): Promise<{ status: string; data: GetNewsfeedResponseDto }> {
    const { limit = 15, after } = dto;

    // 1) Parse cursor
    const cursor = this.parseCursor(after);

    // 2) Fetch 3 separate lists
    const [personalizedPosts, trendingPosts, communityPosts] = await Promise.all([
      this.fetchPersonalizedPosts(user, cursor, limit * 2),
      this.fetchTrendingPosts(cursor, limit),
      this.fetchRandomCommunityPosts(user, cursor, limit),
    ]);

    // 3) Load hashtags and votes for all posts
    const allPosts = [...personalizedPosts, ...trendingPosts, ...communityPosts];
    const postIds = allPosts.map((p) => Number(p.id));
    const hashtagsMap = await this.fetchHashtagsForPosts(postIds);
    const votesMap = await this.fetchVotesForPosts(postIds, user?.id);
    const viewedIds = user?.id ? await this.getViewedIds(user.id) : [];

    // 4) Map to DTOs
    const personalizedItems = this.mapRowsToDto(personalizedPosts, hashtagsMap, viewedIds, votesMap);
    const trendingItems = this.mapRowsToDto(trendingPosts, hashtagsMap, viewedIds, votesMap);
    const communityItems = this.mapRowsToDto(communityPosts, hashtagsMap, viewedIds, votesMap);

    // 5) Interleave ranking with 70-20-10 distribution
    const interleavedItems = this.interleaveRanking(
      personalizedItems,
      trendingItems,
      communityItems,
      limit + 1, // fetch one extra for pagination
    );

    // 6) Paginate
    const { paginatedItems, hasMore, nextCursor } = this.paginate(interleavedItems, limit);

    return {
      status: 'success',
      data: { items: paginatedItems, pagination: { hasMore, nextCursor } },
    };
  }

  /* ========================= INTERLEAVE RANKING ========================= */

  /**
   * Interleave posts from 3 sources with 70-20-10 distribution
   * - 70% from personalized
   * - 20% from trending
   * - 10% from community
   * With fallback logic if any source is exhausted
   */
  private interleaveRanking(
    personalized: NewsfeedItemDto[],
    trending: NewsfeedItemDto[],
    community: NewsfeedItemDto[],
    targetCount: number,
  ): NewsfeedItemDto[] {
    const result: NewsfeedItemDto[] = [];
    const seenIds = new Set<number>();

    let pIndex = 0;
    let tIndex = 0;
    let cIndex = 0;

    while (result.length < targetCount) {
      // Check if all sources exhausted
      if (pIndex >= personalized.length && tIndex >= trending.length && cIndex >= community.length) {
        break;
      }

      // Generate random number 0-99
      const random = Math.floor(Math.random() * 100);

      let selected: NewsfeedItemDto | null = null;

      // Determine which source to pick from based on probability
      if (random < 70) {
        // 70% - Personalized
        selected = this.getNextAvailable(personalized, pIndex, seenIds);
        if (selected) pIndex++;
      } else if (random < 90) {
        // 20% - Trending
        selected = this.getNextAvailable(trending, tIndex, seenIds);
        if (selected) tIndex++;
      } else {
        // 10% - Community
        selected = this.getNextAvailable(community, cIndex, seenIds);
        if (selected) cIndex++;
      }

      // Fallback logic if selected source is exhausted
      if (!selected) {
        // Try personalized first
        selected = this.getNextAvailable(personalized, pIndex, seenIds);
        if (selected) {
          pIndex++;
        } else {
          // Try trending
          selected = this.getNextAvailable(trending, tIndex, seenIds);
          if (selected) {
            tIndex++;
          } else {
            // Try community as last resort
            selected = this.getNextAvailable(community, cIndex, seenIds);
            if (selected) cIndex++;
          }
        }
      }

      // Add to result if we found something
      if (selected) {
        result.push(selected);
        seenIds.add(selected.id);
      }
    }

    return result;
  }

  /**
   * Get next available post from a list that hasn't been seen yet
   */
  private getNextAvailable(
    list: NewsfeedItemDto[],
    startIndex: number,
    seenIds: Set<number>,
  ): NewsfeedItemDto | null {
    for (let i = startIndex; i < list.length; i++) {
      if (!seenIds.has(list[i].id)) {
        return list[i];
      }
    }
    return null;
  }

  /* ========================= FETCH METHODS ========================= */

  /**
   * Fetch personalized posts based on user's interests and follows
   */
  private async fetchPersonalizedPosts(
    user: { id: number; username?: string } | undefined,
    cursor: CursorInfo,
    limit: number,
  ): Promise<RawPostRow[]> {
    if (!user?.id) return [];

    const interestedTags = await this.getInterestedTags(user.id);
    const { recentAuthors, recentCommunities } =
      cursor.score !== null ? await this.getRecentDiversity(user.id, cursor.id) : { recentAuthors: [], recentCommunities: [] };

    const params: unknown[] = [];
    const parts = this.buildPersonalizationParts(params, interestedTags, user.id, recentAuthors, recentCommunities);
    const cursorWhere = this.buildCursorWhere(cursor, params);
    params.push(limit);

    const query = this.buildPersonalizedQuery(parts, cursorWhere, params.length);
    return await this.postRepo.query(query, params);
  }

  /**
   * Fetch trending posts (high engagement in recent time)
   */
  private async fetchTrendingPosts(cursor: CursorInfo, limit: number): Promise<RawPostRow[]> {
    const params: unknown[] = [];
    const cursorWhere = cursor.score !== null && cursor.id !== null 
      ? `AND (trend_score < $1 OR (trend_score = $1 AND p.id < $2))` 
      : '';
    
    if (cursor.score !== null && cursor.id !== null) {
      params.push(cursor.score, cursor.id);
    }
    params.push(limit);

    const query = `
      WITH trending AS (
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
            20 * LN(1 + GREATEST(0, COALESCE(v.up_votes, 0) - COALESCE(v.down_votes, 0)))
            + 15 * LN(1 + COALESCE(r.reacts, 0))
            + 25 * LN(1 + COALESCE(cm.comments, 0))
            + 30 / (1 + POWER(GREATEST(0.01, (EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 3600)), 1.2))
          ) AS trend_score,
          false as is_viewed,
          CASE WHEN COALESCE(views.views, 0) > 0 THEN (COALESCE(cm.comments, 0)::float / COALESCE(views.views, 1)) * 100 ELSE 0 END as engagement_rate
        FROM blog_posts p
        LEFT JOIN users u ON u.id = p."authorId"
        LEFT JOIN (SELECT "postId", COUNT(*)::int AS reacts FROM user_reacts GROUP BY "postId") r ON r."postId" = p.id
        LEFT JOIN (SELECT "postId", COUNT(*)::int AS comments FROM comments GROUP BY "postId") cm ON cm."postId" = p.id
        LEFT JOIN (
          SELECT "postId",
            SUM(CASE WHEN LOWER("voteType"::text) = 'upvote' THEN 1 ELSE 0 END)::int as up_votes,
            SUM(CASE WHEN LOWER("voteType"::text) = 'downvote' THEN 1 ELSE 0 END)::int as down_votes
          FROM user_votes GROUP BY "postId"
        ) v ON v."postId" = p.id
        LEFT JOIN (SELECT "postId", COUNT(DISTINCT "userId")::int as views FROM viewed_history GROUP BY "postId") views ON views."postId" = p.id
        LEFT JOIN community comm ON comm.id = p."communityId"
        WHERE p."isPublic" = true 
          AND p.status = 'ACTIVE'
          AND p."createdAt" <= NOW()
          AND p."createdAt" > NOW() - INTERVAL '7 days'
      )
      SELECT * FROM trending
      WHERE trend_score > 0
      ${cursorWhere}
      ORDER BY trend_score DESC, id DESC
      LIMIT $${params.length}
    `;

    return await this.postRepo.query(query, params);
  }

  /**
   * Fetch random posts from communities user doesn't frequently interact with
   */
  private async fetchRandomCommunityPosts(
    user: { id: number; username?: string } | undefined,
    cursor: CursorInfo,
    limit: number,
  ): Promise<RawPostRow[]> {
    const params: unknown[] = [];
    
    // Exclude user's top communities if logged in
    let excludeCommunities = '';
    if (user?.id) {
      excludeCommunities = `
        AND p."communityId" NOT IN (
          SELECT DISTINCT p2."communityId"
          FROM blog_posts p2
          JOIN viewed_history vh ON vh."postId" = p2.id
          WHERE vh."userId" = $${params.length + 1}
            AND vh."createdAt" > NOW() - INTERVAL '30 days'
          GROUP BY p2."communityId"
          ORDER BY COUNT(*) DESC
          LIMIT 5
        )
      `;
      params.push(user.id);
    }

    params.push(limit);

    const query = `
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
        0 as score,
        false as is_viewed,
        CASE WHEN COALESCE(views.views, 0) > 0 THEN (COALESCE(cm.comments, 0)::float / COALESCE(views.views, 1)) * 100 ELSE 0 END as engagement_rate
      FROM blog_posts p
      LEFT JOIN users u ON u.id = p."authorId"
      LEFT JOIN (SELECT "postId", COUNT(*)::int AS reacts FROM user_reacts GROUP BY "postId") r ON r."postId" = p.id
      LEFT JOIN (SELECT "postId", COUNT(*)::int AS comments FROM comments GROUP BY "postId") cm ON cm."postId" = p.id
      LEFT JOIN (
        SELECT "postId",
          SUM(CASE WHEN LOWER("voteType"::text) = 'upvote' THEN 1 ELSE 0 END)::int as up_votes,
          SUM(CASE WHEN LOWER("voteType"::text) = 'downvote' THEN 1 ELSE 0 END)::int as down_votes
        FROM user_votes GROUP BY "postId"
      ) v ON v."postId" = p.id
      LEFT JOIN (SELECT "postId", COUNT(DISTINCT "userId")::int as views FROM viewed_history GROUP BY "postId") views ON views."postId" = p.id
      LEFT JOIN community comm ON comm.id = p."communityId"
      WHERE p."isPublic" = true 
        AND p.status = 'ACTIVE'
        AND p."createdAt" <= NOW()
        AND p."createdAt" > NOW() - INTERVAL '14 days'
        AND p."communityId" IS NOT NULL
        ${excludeCommunities}
      ORDER BY RANDOM()
      LIMIT $${params.length}
    `;

    return await this.postRepo.query(query, params);
  }

  /* ========================= HELPER METHODS ========================= */

  private parseCursor(after?: string | null): CursorInfo {
    if (!after) return { id: null, score: null };
    try {
      const [idStr, scoreStr] = Buffer.from(after, 'base64').toString('utf-8').split('|');
      return { id: Number(idStr) || null, score: Number(scoreStr) || null };
    } catch {
      return { id: null, score: null };
    }
  }

  private async getInterestedTags(userId: number): Promise<string[]> {
    try {
      const top = await this.viewedHistoryService.getTopHashtags(userId, 25, 14);
      return top.map((t) => t.name);
    } catch {
      return [];
    }
  }

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

  private buildPersonalizationParts(
    params: unknown[],
    interestedTags: string[],
    userId?: number,
    recentAuthors: number[] = [],
    recentCommunities: number[] = [],
  ) {
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

      const userParamIndex = params.length;
      isViewedCheck = `EXISTS(
        SELECT 1 FROM viewed_history vh 
        WHERE vh."userId" = $${userParamIndex}
          AND vh."postId" = p.id
      )`;
    }

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

  private buildPersonalizedQuery(
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
        LEFT JOIN (SELECT "postId", COUNT(*)::int AS reacts FROM user_reacts GROUP BY "postId") r ON r."postId" = p.id
        LEFT JOIN (SELECT "postId", COUNT(*)::int AS comments FROM comments GROUP BY "postId") cm ON cm."postId" = p.id
        LEFT JOIN (
          SELECT "postId",
            SUM(CASE WHEN LOWER("voteType"::text) = 'upvote' THEN 1 ELSE 0 END)::int as up_votes,
            SUM(CASE WHEN LOWER("voteType"::text) = 'downvote' THEN 1 ELSE 0 END)::int as down_votes
          FROM user_votes GROUP BY "postId"
        ) v ON v."postId" = p.id
        LEFT JOIN (SELECT "postId", COUNT(DISTINCT "userId")::int as views FROM viewed_history GROUP BY "postId") views ON views."postId" = p.id
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

  private buildCursorWhere(cursor: CursorInfo, params: unknown[]) {
    if (cursor.score !== null && cursor.id !== null) {
      params.push(cursor.score, cursor.id);
      const index = params.length - 1;
      return `WHERE score < $${index} OR (score = $${index} AND id < $${index + 1})`;
    }
    return '';
  }

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

  private async fetchVotesForPosts(postIds: number[], userId?: number) {
    if (postIds.length === 0) return {};
    
    try {
      const postsWithVotes = await this.postRepo.find({
        where: { id: In(postIds) },
        relations: ['votes', 'votes.user'],
      });
      
      const votesMap: Record<number, { upvotes: number; downvotes: number; userVote: any }> = {};
      for (const postEntity of postsWithVotes) {
        const v = postEntity.getVotes(userId ?? 0);
        votesMap[Number(postEntity.id)] = { 
          upvotes: v.upvotes, 
          downvotes: v.downvotes, 
          userVote: v.userVote 
        };
      }
      return votesMap;
    } catch {
      return {};
    }
  }

  private async getViewedIds(userId: number) {
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return await this.viewedHistoryService.getViewedPostIds(userId, since);
    } catch {
      return [];
    }
  }

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

  private paginate(items: NewsfeedItemDto[], limit: number) {
    const hasMore = items.length > limit;
    const paginatedItems = hasMore ? items.slice(0, limit) : items;
    const lastItem = paginatedItems[paginatedItems.length - 1];
    const nextCursor = hasMore && lastItem 
      ? Buffer.from(`${lastItem.id}|${(lastItem as any).final_score}`).toString('base64') 
      : null;
    return { paginatedItems, hasMore, nextCursor };
  }
}