import { ChildEntity, ManyToOne } from 'typeorm';

import { Comment } from './comment.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';

@ChildEntity('post')
export class PostComment extends Comment {
  @ManyToOne(() => BlogPost, (post) => post.comments)
  post: BlogPost;
}
