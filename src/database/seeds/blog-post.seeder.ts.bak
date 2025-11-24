import { DataSource } from 'typeorm';
import { Seeder } from '../seeder.base';
import { BlogPostFactory } from '../factories/blog-post.factory';
import { PersonalBlogPost } from '../../blog-posts/entities/personal-blog-post.entity';
import { CommunityBlogPost } from '../../blog-posts/entities/community-blog-post.entity';
import { NormalUser } from '../../users/entities/normal-user.entity';
import { Community } from '../../communities/entities/community.entity';
import { Hashtag } from '../../hashtags/entities/hashtag.entity';
import { TextBlock } from '../../blocks/entities/text-block.entity';
import { ImageBlock } from '../../blocks/entities/image-block.entity';
import { faker } from '@faker-js/faker';

export class BlogPostSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    console.log('🌱 Seeding Blog Posts...');

    const personalPostRepository = this.dataSource.getRepository(PersonalBlogPost);
    const communityPostRepository = this.dataSource.getRepository(CommunityBlogPost);
    const userRepository = this.dataSource.getRepository(NormalUser);
    const communityRepository = this.dataSource.getRepository(Community);
    const hashtagRepository = this.dataSource.getRepository(Hashtag);
    const textBlockRepository = this.dataSource.getRepository(TextBlock);
    const imageBlockRepository = this.dataSource.getRepository(ImageBlock);

    try {
      // Get data
      const users = await userRepository.find();
      const communities = await communityRepository.find();
      const hashtags = await hashtagRepository.find();

      if (users.length === 0) {
        this.error('No users found. Please run UserSeeder first.');
        return;
      }

      // Create personal blog posts
      let personalPostCount = 0;
      for (const user of users.slice(0, 30)) {
        const postCount = Math.floor(Math.random() * 5) + 1;
        const posts = BlogPostFactory.createPersonalBatch(user, postCount);

        for (const post of posts) {
          // Add random hashtags
          const hashtagCount = Math.floor(Math.random() * 5) + 1;
          const postHashtags: Hashtag[] = [];
          for (let i = 0; i < hashtagCount; i++) {
            const randomHashtag = hashtags[Math.floor(Math.random() * hashtags.length)];
            if (!postHashtags.find((h) => h.id === randomHashtag.id)) {
              postHashtags.push(randomHashtag);
            }
          }
          post.hashtags = postHashtags;

          const savedPost = await personalPostRepository.save(post);

          // Add blocks (content)
          const blockCount = Math.floor(Math.random() * 3) + 2;
          for (let i = 0; i < blockCount; i++) {
            if (Math.random() > 0.5) {
              // Text block
              const textBlock = new TextBlock();
              textBlock.post = savedPost;
              textBlock.x = 0;
              textBlock.y = i * 100;
              textBlock.width = 800;
              textBlock.height = 200;
              textBlock.text = faker.lorem.paragraphs(Math.floor(Math.random() * 3) + 1);
              await textBlockRepository.save(textBlock);
            } else {
              // Image block
              const imageBlock = new ImageBlock();
              imageBlock.post = savedPost;
              imageBlock.x = 0;
              imageBlock.y = i * 100;
              imageBlock.width = 800;
              imageBlock.height = 400;
              imageBlock.imageUrl = faker.image.urlLoremFlickr({ category: 'abstract' });
              await imageBlockRepository.save(imageBlock);
            }
          }

          personalPostCount++;
        }
      }
      this.success(`Created ${personalPostCount} personal blog posts with blocks`);

      // Create community blog posts
      if (communities.length > 0) {
        let communityPostCount = 0;
        for (const community of communities) {
          const members = community.members || [];
          if (members.length === 0) continue;

          const postCount = Math.floor(Math.random() * 8) + 3;
          for (let i = 0; i < postCount; i++) {
            const randomMember = members[Math.floor(Math.random() * members.length)];
            const post = BlogPostFactory.createCommunityPost(randomMember, community);

            // Add random hashtags
            const hashtagCount = Math.floor(Math.random() * 5) + 1;
            const postHashtags: Hashtag[] = [];
            for (let j = 0; j < hashtagCount; j++) {
              const randomHashtag = hashtags[Math.floor(Math.random() * hashtags.length)];
              if (!postHashtags.find((h) => h.id === randomHashtag.id)) {
                postHashtags.push(randomHashtag);
              }
            }
            post.hashtags = postHashtags;

            const savedPost = await communityPostRepository.save(post);

            // Add blocks
            const blockCount = Math.floor(Math.random() * 3) + 2;
            for (let k = 0; k < blockCount; k++) {
              if (Math.random() > 0.5) {
                const textBlock = new TextBlock();
                textBlock.post = savedPost;
                textBlock.x = 0;
                textBlock.y = k * 100;
                textBlock.width = 800;
                textBlock.height = 200;
                textBlock.text = faker.lorem.paragraphs(Math.floor(Math.random() * 3) + 1);
                await textBlockRepository.save(textBlock);
              } else {
                const imageBlock = new ImageBlock();
                imageBlock.post = savedPost;
                imageBlock.x = 0;
                imageBlock.y = k * 100;
                imageBlock.width = 800;
                imageBlock.height = 400;
                imageBlock.imageUrl = faker.image.urlLoremFlickr({ category: 'tech' });
                await imageBlockRepository.save(imageBlock);
              }
            }

            communityPostCount++;
          }
        }
        this.success(`Created ${communityPostCount} community blog posts with blocks`);
      }

      this.success('✓ Blog Posts seeded successfully');
    } catch (error) {
      this.error('Failed to seed blog posts', error);
      throw error;
    }
  }
}
