import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Block } from 'src/blocks/entities/block.entity';
import { Notification } from 'src/notifications/entities/notification.entity';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { UserReactsModule } from '@modules/user-reacts/user-reacts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, BlogPost, Block, Notification]),
    UserReactsModule,
    NotificationsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
