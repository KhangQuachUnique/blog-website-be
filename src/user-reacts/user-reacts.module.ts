import { Module, Post } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserReact } from './entities/user-react.entity';
import { UserReactsService } from './user-reacts.service';
import { UserReactsController } from './user-reacts.controller';
import { PostUserReact } from './entities/post-user-react.entity';
import { CommentUserReact } from './entities/comment-user-react.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserReact, PostUserReact, CommentUserReact])],
  controllers: [UserReactsController],
  providers: [UserReactsService],
})
export class UserReactsModule {}
