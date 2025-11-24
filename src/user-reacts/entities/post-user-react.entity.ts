import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { ChildEntity, ManyToOne } from 'typeorm';
import { UserReact } from './user-react.entity';

@ChildEntity('post_user_reacts')
export class PostUserReact extends UserReact {
  @ManyToOne(() => BlogPost, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  post: BlogPost;
}
