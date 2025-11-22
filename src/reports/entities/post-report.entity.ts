import { ChildEntity, ManyToOne } from 'typeorm';

import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Report } from './report.entity';

@ChildEntity('post')
export class PostReport extends Report {
  @ManyToOne(() => BlogPost, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  post: BlogPost;
}
