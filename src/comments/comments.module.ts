import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { ChildComment } from './entities/child-comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, ChildComment])],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
