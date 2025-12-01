// src/viewed-history/viewed-history.controller.ts

import {
  Controller,
  Post,
  Param,
  ParseIntPipe,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { ViewedHistoryService } from './viewed-history.service';

@Controller('viewed-history')
export class ViewedHistoryController {
  constructor(private readonly viewedHistoryService: ViewedHistoryService) {}

  /**
   * POST /viewed-history/posts/:postId/view
   * Ghi lại lượt xem bài viết
   * Nếu chưa login → tự động bỏ qua (không ghi gì cả (không lỗi)
   */
  @Post('posts/:postId/view')
  async recordView(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() request: any, // request.user do bạn tự set ở middleware/guard nào đó (hoặc không có
  ) {
    // Nếu có user trong request (đã login) → ghi lịch sử
    // Nếu không có → bỏ qua, không lỗi
    const userId = request.user?.id;

    if (userId) {
      // fire and forget – không cần await cũng được, nhưng await cho chắc
      await this.viewedHistoryService.recordView(userId, postId);
    }

    return { ok: true };
  }

  /**
   * GET /viewed-history/debug/top-hashtags?days=7&limit=10
   * Dùng để debug xem hashtag boost có hoạt động đúng không
   * Chỉ trả về dữ liệu nếu đã login, không thì trả mảng rỗng
   */
  @Get('debug/top-hashtags')
  async getMyTopHashtags(
    @Req() request: any,
    @Query('days') daysStr = '14',
    @Query('limit') limitStr = '20',
  ) {
    const userId = request.user?.id;
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
}