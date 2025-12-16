// src/newsfeed/newsfeed.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsfeedController } from './newsfeed.controller';
import { NewsfeedService } from './newsfeed.service';
import { BlogPost } from '../blog-posts/entities/blog-post.entity';
import { ViewedHistoryModule } from '../viewed-history/viewed-history.module';
import { HashtagsModule } from '../hashtags/hashtags.module';
@Module({
  imports: [TypeOrmModule.forFeature([BlogPost]), ViewedHistoryModule, HashtagsModule],
  controllers: [NewsfeedController],
  providers: [NewsfeedService],
})
export class NewsfeedModule {}