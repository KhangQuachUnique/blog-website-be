// src/newsfeed/newsfeed.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from '../blog-posts/entities/blog-post.entity';
import { GetNewsfeedDto } from './dto/get-newsfeed.dto';

@Injectable()
export class NewsfeedService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly postRepo: Repository<BlogPost>,
  ) {}

  async getNewsfeed(dto: GetNewsfeedDto) {
    const { limit = 15, after } = dto;

    // Decode cursor
    let cursorId: number | null = null;
    let cursorScore: number | null = null;
    if (after) {
      try {
        const decoded = Buffer.from(after, 'base64').toString('utf-8');
        const [idStr, scoreStr] = decoded.split('|');
        cursorId = Number(idStr);
        cursorScore = Number(scoreStr);
      } catch {}
    }

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoin('post.author', 'author')
      .addSelect(['author.username', 'author.avatarUrl'])
      .addSelect(
        `(post."upVotes" - post."downVotes") + (COALESCE(reacts.cnt, 0) * 2) + (COALESCE(comments.cnt, 0) * 3)`,
        'calculated_score',
      )
      .addSelect('COALESCE(reacts.cnt, 0)', 'react_count')
      .addSelect('COALESCE(comments.cnt, 0)', 'comment_count')
      .leftJoin(
        '(SELECT "postId", COUNT(*) AS cnt FROM user_reacts GROUP BY "postId")',
        'reacts',
        'reacts."postId" = post.id',
      )
      .leftJoin(
        '(SELECT "postId", COUNT(*) AS cnt FROM comments WHERE "postId" IS NOT NULL GROUP BY "postId")',
        'comments',
        'comments."postId" = post.id',
      )
      .where('post.isPublic = true')
      .orderBy('calculated_score', 'DESC')
      .addOrderBy('post.id', 'DESC')
      .limit(limit + 1);

    // Cursor pagination
    if (cursorId !== null && cursorScore !== null) {
      qb.andWhere(
        `(post."upVotes" - post."downVotes") + (COALESCE(reacts.cnt, 0) * 2) + (COALESCE(comments.cnt, 0) * 3) < :cursorScore
         OR (
           (post."upVotes" - post."downVotes") + (COALESCE(reacts.cnt, 0) * 2) + (COALESCE(comments.cnt, 0) * 3) = :cursorScore
           AND post.id < :cursorId
         )`,
        { cursorScore, cursorId },
      );
    }

    const rawPosts = await qb.getRawMany();

    const posts = rawPosts.map((p) => ({
      id: p.post_id.toString(),
      title: p.post_title,
      thumbnailUrl: p.post_thumnailUrl,        // đúng tên cột của bạn
      upVotes: Number(p.post_upVotes),
      downVotes: Number(p.post_downVotes),
      createdAt: new Date(p.post_createdAt).toISOString(),
      author: {
        username: p.author_username || 'Anonymous',
        avatarUrl: p.author_avatarUrl || null,
      },
      community: null, // chưa có
      score: Number(p.calculated_score || 0),
      totalReacts: Number(p.react_count || 0),
      totalComments: Number(p.comment_count || 0),
    }));

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const lastItem = items[items.length - 1];

    const nextCursor =
      hasMore && lastItem
        ? Buffer.from(`${lastItem.id}|${lastItem.score}`).toString('base64')
        : null;

    return {
      status: 'success',
      statusCode: 200,
      data: {
        items,
        pagination: { hasMore, nextCursor },
      },
    };
  }
}