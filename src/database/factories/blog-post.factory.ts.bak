import { faker } from '@faker-js/faker';
import { PersonalBlogPost } from '../../blog-posts/entities/personal-blog-post.entity';
import { CommunityBlogPost } from '../../blog-posts/entities/community-blog-post.entity';
import { NormalUser } from '../../users/entities/normal-user.entity';
import { Community } from '../../communities/entities/community.entity';

export class BlogPostFactory {
  static createPersonalPost(
    author: NormalUser,
    override: Partial<PersonalBlogPost> = {},
  ): PersonalBlogPost {
    const post = new PersonalBlogPost();

    post.title = override.title || faker.lorem.sentence({ min: 3, max: 8 });
    post.thumnailUrl = override.thumnailUrl || faker.image.urlLoremFlickr({ category: 'nature' });
    post.upVotes = override.upVotes || faker.number.int({ min: 0, max: 1000 });
    post.downVotes = override.downVotes || faker.number.int({ min: 0, max: 100 });
    post.isPublic = override.isPublic !== undefined ? override.isPublic : true;
    post.author = author;

    return post;
  }

  static createCommunityPost(
    author: NormalUser,
    community: Community,
    override: Partial<CommunityBlogPost> = {},
  ): CommunityBlogPost {
    const post = new CommunityBlogPost();

    post.title = override.title || faker.lorem.sentence({ min: 3, max: 8 });
    post.thumnailUrl = override.thumnailUrl || faker.image.urlLoremFlickr({ category: 'tech' });
    post.upVotes = override.upVotes || faker.number.int({ min: 0, max: 500 });
    post.downVotes = override.downVotes || faker.number.int({ min: 0, max: 50 });
    post.isPublic = override.isPublic !== undefined ? override.isPublic : true;
    post.author = author;
    post.community = community;

    return post;
  }

  static createPersonalBatch(author: NormalUser, count: number): PersonalBlogPost[] {
    return Array.from({ length: count }, () => this.createPersonalPost(author));
  }

  static createCommunityBatch(
    author: NormalUser,
    community: Community,
    count: number,
  ): CommunityBlogPost[] {
    return Array.from({ length: count }, () => this.createCommunityPost(author, community));
  }
}
