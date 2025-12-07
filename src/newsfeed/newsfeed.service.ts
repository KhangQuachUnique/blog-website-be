// src/newsfeed/newsfeed.service.ts
// ✅ Thêm hashtags, totalReacts, totalComments, community vào output

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from '../blog-posts/entities/blog-post.entity';
import { GetNewsfeedDto, GetNewsfeedResponseDto, NewsfeedItemDto } from './dto';
import { ViewedHistoryService } from '../viewed-history/viewed-history.service';

// Raw row type returned by raw SQL in this service. Keep in sync with selected columns.
// Use union of string|number for DB-returned numeric values which may be returned as strings.
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

    // === Cursor ===
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

    // === Hashtags ===
    let interestedTags: string[] = [];
    if (user?.id) {
      const top: { hashtagId: number; name: string; count: number }[] =
        await this.viewedHistoryService.getTopHashtags(user.id, 25, 14);
      interestedTags = top.map((t) => t.name);
    }

    // === Build query + params ===
    const params: unknown[] = [];

    let tagBonus = '0';
    if (interestedTags.length > 0) {
      tagBonus = `(SELECT COUNT(*) FROM post_hashtags ph JOIN hashtags h ON h.id = ph."hashtagId" WHERE ph."postId" = p.id AND h.name = ANY($${params.length + 1}::text[])) * 15`;
      params.push(interestedTags);
    }

    let followBonus = '0';
    if (user?.id) {
      followBonus = `COALESCE((SELECT 20 FROM user_follows f WHERE f."userId" = $${params.length + 1} AND f."followingId" = p."authorId"), 0)`;
      params.push(user.id);
    }

    let viewedPenalty = '0';
    let isViewedCheck = 'false';

    if (user?.id) {
      viewedPenalty = `
        COALESCE((
          SELECT 
            -30 + (EXTRACT(EPOCH FROM (NOW() - vh."createdAt")) / 86400)::int * 2
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

    // Lấy danh sách post đã xem của user (30 ngày gần nhất) để front-end có thể đánh dấu
    let viewedIds: number[] = [];
    if (user?.id) {
      try {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
        viewedIds = await this.viewedHistoryService.getViewedPostIds(user.id, since);
      } catch {
        viewedIds = [];
      }
    }

    let cursorWhere = '';
    if (cursorScore !== null && cursorId !== null) {
      cursorWhere = `WHERE score < $${params.length + 1} OR (score = $${params.length + 1} AND id < $${params.length + 2})`;
      params.push(cursorScore, cursorId);
    }

    // ✅ Query với hashtags, community, reacts, comments
    const query = `
      WITH ranked AS (
        SELECT 
          p.id,
          p.title,
          p.type as post_type,
          p."thumbnailUrl" as thumbnail_url,
          p."createdAt" as created_at,
          u.username,
          u."avatarUrl" as avatar_url,
          COALESCE(r.reacts, 0)::int as total_reacts,
          COALESCE(cm.comments, 0)::int as total_comments,
          COALESCE(v.up_votes, 0)::int as up_votes,
          COALESCE(v.down_votes, 0)::int as down_votes,
          -- Community info (chỉ cho community posts)
          comm.id as community_id,
          comm.name as community_name,
          comm."thumbnailUrl" as community_thumbnail,
          (
            (COALESCE(v.up_votes, 0) - COALESCE(v.down_votes, 0))::int
            + COALESCE(r.reacts, 0)::int * 2
            + COALESCE(cm.comments, 0)::int * 3
            + ${tagBonus}
            + ${followBonus}
            + ${viewedPenalty}
            + 1.0 / (EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 3600 + 2)
          ) AS score,
          ${isViewedCheck} as is_viewed
        FROM blog_posts p
        LEFT JOIN users u ON u.id = p."authorId"
        LEFT JOIN (SELECT "postId", COUNT(*)::int AS reacts FROM user_reacts GROUP BY "postId") r ON r."postId" = p.id
        LEFT JOIN (SELECT "postId", COUNT(*)::int AS comments FROM comments GROUP BY "postId") cm ON cm."postId" = p.id
        LEFT JOIN (SELECT "postId",
                  SUM(CASE WHEN LOWER("voteType"::text) = 'upvote' THEN 1 ELSE 0 END)::int as up_votes,
                  SUM(CASE WHEN LOWER("voteType"::text) = 'downvote' THEN 1 ELSE 0 END)::int as down_votes
            FROM user_votes GROUP BY "postId") v ON v."postId" = p.id
        LEFT JOIN community comm ON comm.id = p."communityId"
        WHERE p."isPublic" = true AND p.status = 'ACTIVE'
      )
      SELECT *
      FROM ranked
      ${cursorWhere}
      ORDER BY score DESC, id DESC
      LIMIT $${params.length + 1}
    `;

    params.push(limit + 1);

    const rawPosts: RawPostRow[] = (await this.postRepo.query(query, params)) as RawPostRow[];

    // ✅ Lấy hashtags cho từng post
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

      // Group hashtags by postId
      hashtagsMap = hashtagsResult.reduce<Record<string, { id: number; name: string }[]>>(
        (acc, row) => {
          const postId = String(row.post_id);
          if (!acc[postId]) acc[postId] = [];
          acc[postId].push({ id: Number(row.id), name: row.name });
          return acc;
        },
        {},
      );
    }

    // ✅ Map với đầy đủ thông tin
    const posts: NewsfeedItemDto[] = rawPosts.map((p) => {
      const item: NewsfeedItemDto = {
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
      } as NewsfeedItemDto;
      return item;
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const lastItem = items[items.length - 1];

    const nextCursor =
      hasMore && lastItem
        ? Buffer.from(
            `${lastItem.id}|${(lastItem as any).final_score ?? (lastItem as any).score}`,
          ).toString('base64')
        : null;
    const response: GetNewsfeedResponseDto = {
      items,
      pagination: { hasMore, nextCursor },
    };

    return {
      status: 'success',
      data: response,
    };
  }
}
