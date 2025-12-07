// src/newsfeed/newsfeed.controller.ts
import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NewsfeedService } from './newsfeed.service';
import { GetNewsfeedDto, GetNewsfeedResponseDto } from './dto';

@Controller('newsfeed')
export class NewsfeedController {
  constructor(private readonly newsfeedService: NewsfeedService) {}

  // Không cần login, ai cũng gọi được
  @Get()
  async getNewsfeed(
    @Query() query: GetNewsfeedDto,
    @Req() request: Request & { user?: { id: number; username?: string } },
  ): Promise<{ status: string; data: GetNewsfeedResponseDto }> {
    const user = request.user;
    return this.newsfeedService.getNewsfeed(query, user as any);
  }
}