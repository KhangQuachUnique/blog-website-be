import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from 'src/users/entities/user.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { Community } from 'src/communities/entities/community.entity';
import { UserVote } from 'src/user-votes/entities/user-vote.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      BlogPost,
      Comment,
      Community,
      UserVote,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
