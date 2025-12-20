import { Module } from '@nestjs/common';
import { BlogPostsService } from './blog-posts.service';
import { BlogPostsController } from './blog-posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPost } from './entities/blog-post.entity';
import { CommunityBlogPost } from './entities/community-blog-post.entity';
import { PersonalBlogPost } from './entities/personal-blog-post.entity';
import { RepostBlogPost } from './entities/repost-blog-post.entity';
import { Block } from 'src/blocks/entities/block.entity';
import { Hashtag } from 'src/hashtags/entities/hashtag.entity';
import { User } from 'src/users/entities/user.entity';
import { Community } from 'src/communities/entities/community.entity';
import { HashtagsService } from 'src/hashtags/hashtags.service';
import { ViewedHistoryModule } from 'src/viewed-history/viewed-history.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UserReactsModule } from 'src/user-reacts/user-reacts.module';
import { CommunityMember } from 'src/communities/entities/community-member.entity';
import { ViewedHistory } from 'src/viewed-history/entities/viewed-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlogPost,
      CommunityBlogPost,
      PersonalBlogPost,
      RepostBlogPost,
      Block,
      Hashtag,
      User,
      Community,
      CommunityMember,
      ViewedHistory,
    ]),
    ViewedHistoryModule,
    NotificationsModule,
    UserReactsModule,
  ],
  controllers: [BlogPostsController],
  providers: [BlogPostsService, HashtagsService],
  exports: [BlogPostsService],
})
export class BlogPostsModule {}
