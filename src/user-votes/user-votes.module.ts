import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserVotesController } from './user-votes.controller';
import { UserVotesService } from './user-votes.service';
import { UserVote } from './entities/user-vote.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { User } from 'src/users/entities/user.entity';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserVote, BlogPost, User]), NotificationsModule],
  controllers: [UserVotesController],
  providers: [UserVotesService],
  exports: [UserVotesService],
})
export class UserVotesModule {}
