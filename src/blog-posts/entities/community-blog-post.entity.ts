import { ChildEntity, Column, ManyToOne } from 'typeorm';

import { BlogPost } from './blog-post.entity';
import { Community } from 'src/communities/entities/community.entity';
import { BlogPostType } from '../enums/blog-post-type.enum';

@ChildEntity(BlogPostType.COMMUNITY)
export class CommunityBlogPost extends BlogPost {
  @ManyToOne(() => Community, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  community: Community;

  @Column({ default: false })
  isApproved: boolean;
}
