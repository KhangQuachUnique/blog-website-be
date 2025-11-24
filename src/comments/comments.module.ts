import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './entities/comment.entity';
import { ChildComment } from './entities/child-comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, ChildComment])
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService], // Export để các modules khác có thể sử dụng
})
export class CommentsModule {}
