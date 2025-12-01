import { ChildEntity } from 'typeorm';

import { BlogPost } from './blog-post.entity';
import { BlogPostType } from '../enums/blog-post-type.enum';

@ChildEntity(BlogPostType.PERSONAL)
export class PersonalBlogPost extends BlogPost {
  // Personal blog posts don't have additional fields beyond the base BlogPost
  // They are distinguished by their type in the discriminator column
}