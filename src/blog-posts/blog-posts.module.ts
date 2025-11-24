import { Module } from '@nestjs/common';
import { BlogPostsService } from './blog-posts.service';
import { BlogPostsController } from './blog-posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPost } from './entities/blog-post.entity';
import { CommunityBlogPost } from './entities/community-blog-post.entity';
// import { PersonalBlogPost } from './entities/personal-blog-post.entity';
// import { RepostBlogPost } from './entities/repost-blog-post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogPost, CommunityBlogPost]),
  ],
  controllers: [BlogPostsController],
  providers: [BlogPostsService],
})
export class BlogPostsModule {}
