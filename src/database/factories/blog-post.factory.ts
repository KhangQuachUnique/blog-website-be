import { faker, Faker } from '@faker-js/faker';
import { vi } from '@faker-js/faker';
import { PersonalBlogPost } from '../../blog-posts/entities/personal-blog-post.entity';
import { CommunityBlogPost } from '../../blog-posts/entities/community-blog-post.entity';
import { RepostBlogPost } from '../../blog-posts/entities/repost-blog-post.entity';
import { BlogPost } from '../../blog-posts/entities/blog-post.entity';
import { User } from '../../users/entities/user.entity';
import { Community } from '../../communities/entities/community.entity';
import { EBlogPostStatus } from '../../blog-posts/enums/blog-post-status.enum';

// Tạo Faker instance với locale tiếng Việt
const fakerVi = new Faker({ locale: vi });

export class BlogPostFactory {
  /**
   * Tạo blog post tiếng Việt
   * @param useVietnamese - true: dùng tiếng Việt, false: dùng tiếng Anh (default: true)
   */
  static createPersonalPost(
    author: User,
    override: Partial<PersonalBlogPost> = {},
    useVietnamese = true,
  ): PersonalBlogPost {
    const post = new PersonalBlogPost();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;

    // Title: max 255 chars, required
    post.title =
      override.title || fakerInstance.lorem.sentence({ min: 3, max: 8 }).substring(0, 255);
    // ShortDescription: required in DTO
    post.shortDescription =
      override.shortDescription || fakerInstance.lorem.sentences({ min: 1, max: 3 });
    post.thumbnailUrl = override.thumbnailUrl || fakerInstance.image.url();
    post.isPublic = override.isPublic !== undefined ? override.isPublic : true;
    post.status = override.status || EBlogPostStatus.ACTIVE;
    post.author = author;

    return post;
  }

  static createCommunityPost(
    author: User,
    community: Community,
    override: Partial<CommunityBlogPost> = {},
    useVietnamese = true,
  ): CommunityBlogPost {
    const post = new CommunityBlogPost();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;

    post.title =
      override.title || fakerInstance.lorem.sentence({ min: 3, max: 8 }).substring(0, 255);
    post.shortDescription =
      override.shortDescription || fakerInstance.lorem.sentences({ min: 1, max: 3 });
    post.thumbnailUrl = override.thumbnailUrl || fakerInstance.image.url();
    post.isPublic = override.isPublic !== undefined ? override.isPublic : true;
    post.status = override.status || EBlogPostStatus.ACTIVE;
    post.isApproved = override.isApproved !== undefined ? override.isApproved : true;
    post.author = author;
    post.community = community;

    return post;
  }

  static createRepost(
    author: User,
    originalPost: BlogPost,
    override: Partial<RepostBlogPost> = {},
    useVietnamese = true,
  ): RepostBlogPost {
    const post = new RepostBlogPost();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;

    post.title =
      override.title ||
      `[Repost] ${fakerInstance.lorem.sentence({ min: 3, max: 8 })}`.substring(0, 255);
    post.shortDescription =
      override.shortDescription || fakerInstance.lorem.sentences({ min: 1, max: 2 });
    post.thumbnailUrl = override.thumbnailUrl || originalPost.thumbnailUrl;
    post.isPublic = override.isPublic !== undefined ? override.isPublic : true;
    post.status = override.status || EBlogPostStatus.ACTIVE;
    post.author = author;
    post.originalPost = originalPost;

    return post;
  }

  static createPersonalBatch(
    author: User,
    count: number,
    useVietnamese = true,
  ): PersonalBlogPost[] {
    return Array.from({ length: count }, () => this.createPersonalPost(author, {}, useVietnamese));
  }

  static createCommunityBatch(
    author: User,
    community: Community,
    count: number,
    useVietnamese = true,
  ): CommunityBlogPost[] {
    return Array.from({ length: count }, () =>
      this.createCommunityPost(author, community, {}, useVietnamese),
    );
  }

  static createRepostBatch(
    author: User,
    originalPosts: PersonalBlogPost[],
    useVietnamese = true,
  ): RepostBlogPost[] {
    return originalPosts.map((post) => this.createRepost(author, post, {}, useVietnamese));
  }
}
