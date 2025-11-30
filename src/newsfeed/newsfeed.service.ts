// src/newsfeed/newsfeed.service.ts
// FIX: Sửa tên cột để lấy đúng data từ PostgreSQL

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from '../blog-posts/entities/blog-post.entity';
import { GetNewsfeedDto } from './dto/get-newsfeed.dto';
import { ViewedHistoryService } from '../viewed-history/viewed-history.service';

@Injectable()
export class NewsfeedService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly postRepo: Repository<BlogPost>,
    private readonly viewedHistoryService: ViewedHistoryService,
  ) {}

  async getNewsfeed(dto: GetNewsfeedDto, user?: any) {
    const { limit = 15, after } = dto;

    // === Cursor ===
    let cursorScore: number | null = null;
    let cursorId: number | null = null;
    if (after) {
      try {
        const [idStr, scoreStr] = Buffer.from(after, 'base64').toString('utf-8').split('|');
        cursorId = Number(idStr);
        cursorScore = Number(scoreStr);
      } catch {}
    }

    // === Hashtags ===
    let interestedTags: string[] = [];
    if (user?.id) {
      const top = await this.viewedHistoryService.getTopHashtags(user.id, 25, 14);
      interestedTags = top.map((t: any) => t.name);
    }

    // === Build query + params ===
    const params: any[] = [];
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

    let cursorWhere = '';
    if (cursorScore !== null && cursorId !== null) {
      cursorWhere = `WHERE score < $${params.length + 1} OR (score = $${params.length + 1} AND id < $${params.length + 2})`;
      params.push(cursorScore, cursorId);
    }

    // ✅ FIX: Thêm alias rõ ràng cho các cột
    const query = `
      WITH ranked AS (
        SELECT 
          p.id,
          p.title,
          p."thumbnailUrl" as thumbnail_url,
          p."upVotes" as up_votes,
          p."downVotes" as down_votes,
          p."createdAt" as created_at,
          u.username,
          u."avatarUrl" as avatar_url,
          (
            (p."upVotes" - p."downVotes")::int
            + COALESCE(r.reacts, 0)::int * 2
            + COALESCE(c.comments, 0)::int * 3
            + ${tagBonus}
            + ${followBonus}
            + 1.0 / (EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 3600 + 2)
          ) AS score
        FROM blog_posts p
        LEFT JOIN users u ON u.id = p."authorId"
        LEFT JOIN (SELECT "postId", COUNT(*)::int AS reacts FROM user_reacts GROUP BY "postId") r ON r."postId" = p.id
        LEFT JOIN (SELECT "postId", COUNT(*)::int AS comments FROM comments GROUP BY "postId") c ON c."postId" = p.id
        WHERE p."isPublic" = true AND p.status = 'ACTIVE'
      )
      SELECT *
      FROM ranked
      ${cursorWhere}
      ORDER BY score DESC, id DESC
      LIMIT $${params.length + 1}
    `;

    params.push(limit + 1);

    const rawPosts = await this.postRepo.query(query, params);

    // ✅ Map với tên cột đã alias
    const posts = rawPosts.map((p: any) => ({
      id: String(p.id),
      title: p.title || 'Untitled',
      thumbnailUrl: p.thumbnail_url || null,
      upVotes: Number(p.up_votes) || 0,
      downVotes: Number(p.down_votes) || 0,
      createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
      author: {
        username: p.username || 'Anonymous',
        avatarUrl: p.avatar_url || null,
      },
      community: null,
      score: Number(Number(p.score).toFixed(4)),
      totalReacts: 0,
      totalComments: 0,
    }));

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const lastItem = items[items.length - 1];

    const nextCursor = hasMore && lastItem
      ? Buffer.from(`${lastItem.id}|${lastItem.score}`).toString('base64')
      : null;

    return {
      status: 'success',
      data: {
        items,
        pagination: { hasMore, nextCursor },
      },
    };
  }
}