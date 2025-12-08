import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from './entities/report.entity';
import { User } from 'src/users/entities/user.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Comment } from 'src/comments/entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, User, BlogPost, Comment])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
