import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViewedHistoryService } from './viewed-history.service';
import { ViewedHistoryController } from './viewed-history.controller';
import { ViewedHistory } from './entities/viewed-history.entity';
import { BlogPost } from '../blog-posts/entities/blog-post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ViewedHistory, BlogPost]), // thêm repository vào đây
  ],
  controllers: [ViewedHistoryController],
  providers: [ViewedHistoryService],
  exports: [ViewedHistoryService],
})
export class ViewedHistoryModule {}
