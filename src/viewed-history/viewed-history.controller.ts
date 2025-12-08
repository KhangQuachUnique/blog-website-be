// src/viewed-history/viewed-history.controller.ts

import {
  Controller,
  Post,
  Param,
  ParseIntPipe,
  Req,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ViewedHistoryService } from './viewed-history.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('viewed-history')
export class ViewedHistoryController {
  constructor(private readonly viewedHistoryService: ViewedHistoryService) {}

  /**
   * POST /viewed-history/posts/:postId/view
   * Ghi lại lượt xem bài viết
   * Nếu chưa login → tự động bỏ qua (không ghi gì cả (không lỗi)
   */
  @Post('posts/:postId/view')
  @UseGuards(OptionalJwtAuthGuard)
  async recordView(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() request: Request & { user?: { userId?: number; id?: number; username?: string } },
  ) {
    // Nếu có user trong request (đã login) → ghi lịch sử
    // Nếu không có → bỏ qua, không lỗi
    const userId = request.user?.userId ?? request.user?.id;

    if (userId) {
      // fire and forget – không cần await cũng được, nhưng await cho chắc
      await this.viewedHistoryService.recordView(userId, postId);
    }

    return { ok: true };
  }

  /**
   * GET /viewed-history/posts/:postId/status
   * Trả về viewed: true/false cho bài viết với user hiện tại (nếu login)
   */
  @Get('posts/:postId/status')
  @UseGuards(OptionalJwtAuthGuard)
  async status(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() request: Request & { user?: { userId?: number; id?: number } },
  ) {
    const userId = request.user?.userId ?? request.user?.id;
    if (!userId) return { viewed: false };

    const ids = await this.viewedHistoryService.getViewedPostIds(userId);
    return { viewed: ids.includes(postId) };
  }

  /**
   * GET /viewed-history/debug/top-hashtags?days=7&limit=10
   * Dùng để debug xem hashtag boost có hoạt động đúng không
   * Chỉ trả về dữ liệu nếu đã login, không thì trả mảng rỗng
   */
  @Get('debug/top-hashtags')
  async getMyTopHashtags(
    @Req() request: Request & { user?: { userId?: number; id?: number; username?: string } },
    @Query('days') daysStr = '14',
    @Query('limit') limitStr = '20',
  ) {
    const userId = request.user?.userId ?? request.user?.id;
    if (!userId) {
      return { top: [], note: 'Login required' };
    }

    const days = parseInt(daysStr, 10);
    const limit = parseInt(limitStr, 10);

    const top = await this.viewedHistoryService.getTopHashtags(
      userId,
      limit,
      days,
    );

    return {
      userId,
      periodDays: days,
      top,
    };
  }

  /**
   * GET /viewed-history/debug/recent
   * Return recent viewed_history rows for debugging
   */
  @Get('debug/recent')
  @UseGuards(OptionalJwtAuthGuard)
  async getRecent(
    @Query('limit') limitStr = '50',
  ) {
    const limit = parseInt(limitStr, 10) || 50;
    const rows = await this.viewedHistoryService.getRecentViews(limit);
    return { count: rows.length, rows };
  }
}