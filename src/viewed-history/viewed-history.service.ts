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
    // Log for debugging to help trace why rows may not appear
    console.log('[ViewedHistory] recordView called', { userId, postId });

    try {
      // Try to find an existing record for (user, post). If exists, update timestamp; otherwise create.
      const existing = await this.viewedRepo.findOne({
        where: { user: { id: userId }, post: { id: postId } },
        relations: ['user', 'post'],
      });

      if (existing) {
        existing.createdAt = new Date();
        await this.viewedRepo.save(existing);
        console.log('[ViewedHistory] updated existing view', { id: existing.id });
        return;
      }

      const vh = this.viewedRepo.create({
        user: { id: userId } as User,
        post: { id: postId } as BlogPost,
      });

      const saved = await this.viewedRepo.save(vh);
      console.log('[ViewedHistory] inserted view', { id: saved.id });
    } catch (err) {
      console.error('[ViewedHistory] recordView error', err);
      throw err;
    }
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
   * Debug helper: return recent viewed_history rows (id, userId, postId, createdAt)
   */
  async getRecentViews(limit = 50): Promise<{ id: number; userId: number; postId: number; createdAt: Date }[]> {
    const result = await this.viewedRepo
      .createQueryBuilder('vh')
      .leftJoin('vh.user', 'user')
      .leftJoin('vh.post', 'post')
      .select('vh.id', 'id')
      .addSelect('vh."createdAt"', 'createdAt')
      .addSelect('user.id', 'userId')
      .addSelect('post.id', 'postId')
      .orderBy('vh."createdAt"', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((r) => ({ id: Number(r.id), userId: Number(r.userId), postId: Number(r.postId), createdAt: new Date(r.createdAt) }));
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