import { ChildEntity, ManyToOne } from 'typeorm';

import { BlogPost } from './blog-post.entity';
import { BlogPostType } from '../enums/blog-post-type.enum';
import { PersonalBlogPost } from './personal-blog-post.entity';

@ChildEntity(BlogPostType.REPOST)
export class RepostBlogPost extends BlogPost {
  @ManyToOne(() => PersonalBlogPost, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  originalPost: PersonalBlogPost;
}
