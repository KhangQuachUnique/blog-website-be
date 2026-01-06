import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserVotesController } from './user-votes.controller';
import { UserVotesService } from './user-votes.service';
import { UserVote } from './entities/user-vote.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserVote, BlogPost, User])],
  controllers: [UserVotesController],
  providers: [UserVotesService],
  exports: [UserVotesService],
})
export class UserVotesModule {}
