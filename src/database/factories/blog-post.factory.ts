import { faker, Faker } from '@faker-js/faker';
import { vi } from '@faker-js/faker';
import { PersonalBlogPost } from '../../blog-posts/entities/personal-blog-post.entity';
import { CommunityBlogPost } from '../../blog-posts/entities/community-blog-post.entity';
import { RepostBlogPost } from '../../blog-posts/entities/repost-blog-post.entity';
import { User } from '../../users/entities/user.entity';
import { Community } from '../../communities/entities/community.entity';

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

    // Tiếng Việt: "Khám phá những địa điểm du lịch tuyệt vời"
    // Tiếng Anh: "Discover amazing travel destinations"
    post.title = override.title || fakerInstance.lorem.sentence({ min: 3, max: 8 });
    post.thumbnailUrl = override.thumbnailUrl || fakerInstance.image.url();
    post.upVotes = override.upVotes || fakerInstance.number.int({ min: 0, max: 1000 });
    post.downVotes = override.downVotes || fakerInstance.number.int({ min: 0, max: 100 });
    post.isPublic = override.isPublic !== undefined ? override.isPublic : true;
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

    post.title = override.title || fakerInstance.lorem.sentence({ min: 3, max: 8 });
    post.thumbnailUrl = override.thumbnailUrl || fakerInstance.image.url();
    post.upVotes = override.upVotes || fakerInstance.number.int({ min: 0, max: 500 });
    post.downVotes = override.downVotes || fakerInstance.number.int({ min: 0, max: 50 });
    post.isPublic = override.isPublic !== undefined ? override.isPublic : true;
    post.author = author;
    post.community = community;

    return post;
  }

  static createRepost(
    author: User,
    originalPostId: number,
    override: Partial<RepostBlogPost> = {},
    useVietnamese = true,
  ): RepostBlogPost {
    const post = new RepostBlogPost();
    const fakerInstance: Faker = useVietnamese ? fakerVi : faker;

    post.title = override.title || `[Repost] ${fakerInstance.lorem.sentence({ min: 3, max: 8 })}`;
    post.thumbnailUrl = override.thumbnailUrl || fakerInstance.image.url();
    post.upVotes = override.upVotes || fakerInstance.number.int({ min: 0, max: 300 });
    post.downVotes = override.downVotes || fakerInstance.number.int({ min: 0, max: 30 });
    post.isPublic = override.isPublic !== undefined ? override.isPublic : true;
    post.author = author;
    post.originalPostId = originalPostId;

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
    originalPostIds: number[],
    useVietnamese = true,
  ): RepostBlogPost[] {
    return originalPostIds.map((id) => this.createRepost(author, id, {}, useVietnamese));
  }
}