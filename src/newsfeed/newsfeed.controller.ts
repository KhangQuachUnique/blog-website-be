// src/newsfeed/newsfeed.controller.ts
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { NewsfeedService } from './newsfeed.service';
import { GetNewsfeedDto, GetNewsfeedResponseDto } from './dto';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { JwtUser } from 'src/auth/dto/validate-payload.dto';

@Controller('newsfeed')
export class NewsfeedController {
  constructor(private readonly newsfeedService: NewsfeedService) {}

  // Không cần login, ai cũng gọi được
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async getNewsfeed(
    @Query() query: GetNewsfeedDto,
    @Query('seed') seedParam?: string,
    @Req() request?: Request,
  ): Promise<{ status: string; data: GetNewsfeedResponseDto }> {
    const user = request?.user as JwtUser;
    const seed = seedParam ? parseFloat(seedParam) : undefined;
    console.log('user', user);
    return this.newsfeedService.getNewsfeed({ ...query, seed }, user);
  }
}
