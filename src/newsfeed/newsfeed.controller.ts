// src/newsfeed/newsfeed.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { NewsfeedService } from './newsfeed.service';
import { GetNewsfeedDto } from './dto/get-newsfeed.dto';

@Controller('newsfeed')
export class NewsfeedController {
  constructor(private readonly newsfeedService: NewsfeedService) {}

  // Không cần login, ai cũng gọi được
  @Get()
  getNewsfeed(@Query() query: GetNewsfeedDto) {
    // userId = null → chạy chế độ chung (không cá nhân hóa)
    return this.newsfeedService.getNewsfeed(query);
  }
}