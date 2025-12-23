import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Block } from 'src/blocks/entities/block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, BlogPost, Block])],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
