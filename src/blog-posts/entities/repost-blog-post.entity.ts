import { ChildEntity, Column } from 'typeorm';

import { BlogPost } from './blog-post.entity';

@ChildEntity('repost')
export class RepostBlogPost extends BlogPost {
  @Column({ type: 'bigint' })
  originalPostId: number;
}
