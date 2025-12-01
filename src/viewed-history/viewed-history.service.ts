// src/viewed-history/viewed-history.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual } from 'typeorm';
import { ViewedHistory } from './entities/viewed-history.entity';
import { BlogPost } from '../blog-posts/entities/blog-post.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ViewedHistoryService {
  constructor(
    @InjectRepository(ViewedHistory)
    private readonly viewedRepo: Repository<ViewedHistory>,

    @InjectRepository(BlogPost)
    private readonly postRepo: Repository<BlogPost>,
  ) {}

  /**
   * Ghi lại lịch sử xem bài viết (gọi khi user click vào post)
   * Dùng upsert để tránh duplicate
   */
  async recordView(userId: number, postId: number): Promise<void> {
    await this.viewedRepo.upsert(
      {
        user: { id: userId } as User,
        post: { id: postId } as BlogPost,
      },
      ['user', 'post'], // conflict columns
    );
  ;
  }

  /**
   * Lấy top hashtag mà user đã xem nhiều nhất trong X ngày gần đây
   * Dùng cho cá nhân hóa Newsfeed
   */
  async getTopHashtags(
    userId: number,
    limit = 20,
    days = 14,
  ): Promise<{ hashtagId: number; name: string; count: number }[]> {
    const result = await this.viewedRepo
      .createQueryBuilder('vh')
      .innerJoin('vh.post', 'post')
      .innerJoin('post.hashtags', 'hashtag')
      .select('hashtag.id', 'hashtagId')
      .addSelect('hashtag.name', 'name')
      .addSelect('COUNT(*)::int', 'count')
      .where('vh.userId = :userId', { userId })
      .andWhere('vh.createdAt >= NOW() - INTERVAL :days DAY', { days })
      .groupBy('hashtag.id')
      .orderBy('count', 'DESC')
      .addOrderBy('hashtag.name', 'ASC')
      .limit(limit)
      .getRawMany();

    return result;
  }

  /**
   * Lấy danh sách postId mà user đã xem (dùng để loại khỏi feed nếu muốn)
   */
  async getViewedPostIds(userId: number, since?: Date): Promise<number[]> {
    const qb = this.viewedRepo
      .createQueryBuilder('vh')
      .select('vh.postId', 'postId')
      .where('vh.userId = :userId', { userId });

    if (since) {
      qb.andWhere('vh.createdAt >= :since', { since });
    }

    const result = await qb.getRawMany();
    return result.map((r) => Number(r.postId));
  }

  /**
   * (Tùy chọn) Xóa lịch sử cũ để tiết kiệm DB
   */
  async cleanupOldRecords(olderThanDays = 180): Promise<void> {
    await this.viewedRepo
      .createQueryBuilder()
      .delete()
      .where('createdAt < NOW() - INTERVAL :days DAY', { days: olderThanDays })
      .execute();
  }
}