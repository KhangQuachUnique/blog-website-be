import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserReact } from './entities/user-react.entity';
import { UserReactsService } from './user-reacts.service';
import { UserReactsController } from './user-reacts.controller';
import { User } from 'src/users/entities/user.entity';
import { Emoji } from 'src/emojis/entities/emoji.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Comment } from 'src/comments/entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserReact, User, Emoji, BlogPost, Comment])],
  controllers: [UserReactsController],
  providers: [UserReactsService],
  exports: [UserReactsService],
})
export class UserReactsModule {}
