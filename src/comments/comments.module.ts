import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { PostComment } from './entities/post-comment.entity';
import { BlockComment } from './entities/block-comment.entity';
import { ChildComment } from './entities/child-comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, PostComment, BlockComment, ChildComment])],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
