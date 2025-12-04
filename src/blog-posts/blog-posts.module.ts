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
    ]),
  ],
  controllers: [BlogPostsController],
  providers: [BlogPostsService, HashtagsService],
  exports: [BlogPostsService],
})
export class BlogPostsModule {}
