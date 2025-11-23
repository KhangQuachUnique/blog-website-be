import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from './entities/report.entity';
import { UserReport } from './entities/user-report.entity';
import { PostReport } from './entities/post-report.entity';
import { CommentReport } from './entities/comment-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, UserReport, PostReport, CommentReport])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
