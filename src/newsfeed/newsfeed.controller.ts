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
    @Query('seed') seedParam?: string,
    @Req() request?: Request & { user?: { id: number; username?: string } },
  ): Promise<{ status: string; data: GetNewsfeedResponseDto }> {
    const user = request?.user;
    const seed = seedParam ? parseFloat(seedParam) : undefined;
    return this.newsfeedService.getNewsfeed({ ...query, seed }, user as any);
  }
}