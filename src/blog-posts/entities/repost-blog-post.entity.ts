import { ChildEntity, Column } from 'typeorm';

import { BlogPost } from './blog-post.entity';
import { BlogPostType } from '../enums/blog-post-type.enum';

@ChildEntity(BlogPostType.REPOST)
export class RepostBlogPost extends BlogPost {
  @Column({ type: 'bigint' })
  originalPostId: number;
}