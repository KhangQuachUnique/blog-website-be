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

  async getNewsfeed(dto: GetNewsfeedDto, userId: number | null = null) {
  const { limit = 15, after } = dto;

  let cursorPostId: number | null = null;
  let cursorScore: number | null = null;
  if (after) {
    try {
      const decoded = Buffer.from(after, 'base64').toString();
      const [id, score] = decoded.split('|');
      cursorPostId = Number(id);
      cursorScore = Number(score);
    } catch {}
  }

  const qb = this.postRepo.createQueryBuilder('post')
    .leftJoin('post.author', 'author')
    .leftJoin('post.community', 'community')
    .addSelect(['author.username', 'author.avatarUrl', 'community.name'])
    .where('post.isPublic = true');

  if (cursorPostId && cursorScore !== null) {
    qb.andWhere('calculated_score < :cursorScore', { cursorScore })
      .andWhere('post.id < :cursorPostId', { cursorPostId })
      .orWhere('calculated_score = :cursorScore AND post.id < :cursorPostId', { cursorScore, cursorPostId });
  }

  const rawResult = await qb
    .addSelect(
      `(post."upVotes" - post."downVotes") + COALESCE(reacts.cnt, 0) * 2 + COALESCE(comments.cnt, 0) * 3 AS calculated_score`
    )
    .leftJoin('(SELECT "postId", COUNT(*) AS cnt FROM user_reacts GROUP BY "postId")', 'reacts', 'reacts."postId" = post.id')
    .leftJoin('(SELECT "postId", COUNT(*) AS cnt FROM comments WHERE "postId" IS NOT NULL GROUP BY "postId")', 'comments', 'comments."postId" = post.id')
    .orderBy('calculated_score', 'DESC')
    .addOrderBy('post.id', 'DESC')
    .limit(limit + 1)
    .getRawMany();

  const posts = rawResult.map(p => ({
    id: p.post_id,
    title: p.post_title,
    thumbnailUrl: p.post_thumbnailUrl,
    upVotes: Number(p.post_upVotes),
    downVotes: Number(p.post_downVotes),
    createdAt: p.post_createdAt,
    author: { username: p.author_username, avatarUrl: p.author_avatarUrl || null },
    community: p.community_name ? { name: p.community_name } : null,
    score: Number(p.calculated_score || 0),
    totalReacts: Number(p.reacts_cnt || 0),
    totalComments: Number(p.comments_cnt || 0),
  }));

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore
    ? Buffer.from(`${items[items.length - 1].id}|${items[items.length - 1].score}`).toString('base64')
    : null;

return {
  data: {
    items,
    pagination: { hasMore, nextCursor }
  },
  meta: {
    pagination: { hasMore, nextCursor }  // hoặc bỏ meta cũng được
  }
};
}

  // Lấy hashtag user hay tương tác (react hoặc comment)
//   private async getUserFavoriteHashtags(userId: number, topN: number = 12): Promise<string[]> {
//     const result = await this.postRepo.manager.query(`
//       SELECT h.name
//       FROM post_hashtags ph
//       JOIN hashtags h ON h.id = ph."hashtagId"
//       WHERE ph."postId" IN (
//         SELECT "postId" FROM user_reacts WHERE "userId" = $1
//         UNION
//         SELECT "postId" FROM comments WHERE "commenterId" = $1
//       )
//       GROUP BY h.name
//       ORDER BY COUNT(*) DESC
//       LIMIT $2
//     `, [userId, topN]);

//     return result.map((r: any) => r.name);
//   }
}