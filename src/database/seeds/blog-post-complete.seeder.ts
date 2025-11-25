import { DataSource, Repository } from 'typeorm';
import { Seeder } from '../seeder.base';
import { BlogPostFactory } from '../factories/blog-post.factory';
import { CommentFactory } from '../factories/comment.factory';
import { UserReactFactory } from '../factories/user-react.factory';
import { PersonalBlogPost } from '../../blog-posts/entities/personal-blog-post.entity';
import { CommunityBlogPost } from '../../blog-posts/entities/community-blog-post.entity';
import { RepostBlogPost } from '../../blog-posts/entities/repost-blog-post.entity';
import { NormalUser } from '../../users/entities/normal-user.entity';
import { Community } from '../../communities/entities/community.entity';
import { Hashtag } from '../../hashtags/entities/hashtag.entity';
import { TextBlock } from '../../blocks/entities/text-block.entity';
import { ImageBlock } from '../../blocks/entities/image-block.entity';
import { PostComment } from '../../comments/entities/post-comment.entity';
import { ChildComment } from '../../comments/entities/child-comment.entity';
import { PostUserReact } from '../../user-reacts/entities/post-user-react.entity';
import { Emoji } from '../../emojis/entities/emoji.entity';
import { faker, Faker } from '@faker-js/faker';
import { vi } from '@faker-js/faker';

const fakerVi = new Faker({ locale: vi });

export class BlogPostSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    console.log('🌱 Seeding Blog Posts, Comments, and Reactions...');

    const personalPostRepository = this.dataSource.getRepository(PersonalBlogPost);
    const communityPostRepository = this.dataSource.getRepository(CommunityBlogPost);
    const repostRepository = this.dataSource.getRepository(RepostBlogPost);
    const userRepository = this.dataSource.getRepository(NormalUser);
    const communityRepository = this.dataSource.getRepository(Community);
    const hashtagRepository = this.dataSource.getRepository(Hashtag);
    const textBlockRepository = this.dataSource.getRepository(TextBlock);
    const imageBlockRepository = this.dataSource.getRepository(ImageBlock);
    const postCommentRepository = this.dataSource.getRepository(PostComment);
    const childCommentRepository = this.dataSource.getRepository(ChildComment);
    const postReactRepository = this.dataSource.getRepository(PostUserReact);
    const emojiRepository = this.dataSource.getRepository(Emoji);

    try {
      // Get data
      const users = await userRepository.find();
      const communities = await communityRepository.find({ relations: ['members', 'members.user', 'emojis'] });
      const hashtags = await hashtagRepository.find();
      const allEmojis = await emojiRepository.find();

      if (users.length === 0) {
        this.error('No users found. Please run UserSeeder first.');
        return;
      }

      const allCreatedPostIds: number[] = [];

      // 1. Create Personal Blog Posts (Tiếng Việt + Tiếng Anh)
      console.log('  📝 Creating personal blog posts...');
      let personalPostCount = 0;
      for (const user of users.slice(0, 40)) {
        const postCount = Math.floor(Math.random() * 4) + 1;
        const useVietnamese = Math.random() > 0.3; // 70% tiếng Việt, 30% tiếng Anh
        const posts = BlogPostFactory.createPersonalBatch(user, postCount, useVietnamese);

        for (const post of posts) {
          // Add random hashtags
          post.hashtags = this.getRandomHashtags(hashtags, Math.floor(Math.random() * 5) + 1);
          const savedPost = await personalPostRepository.save(post);
          allCreatedPostIds.push(Number(savedPost.id));

          // Add blocks
          await this.addBlocksToPost(
            savedPost,
            textBlockRepository,
            imageBlockRepository,
            useVietnamese,
          );

          // Add comments
          await this.addCommentsToPost(
            savedPost,
            users,
            postCommentRepository,
            childCommentRepository,
            useVietnamese,
          );

          // Add reactions
          if (allEmojis.length > 0) {
            await this.addReactionsToPost(savedPost, users, allEmojis, postReactRepository);
          }

          personalPostCount++;
        }
      }
      this.success(`Created ${personalPostCount} personal blog posts`);

      // 2. Create Community Blog Posts
      console.log('  🏘️  Creating community blog posts...');
      let communityPostCount = 0;
      if (communities.length > 0) {
        for (const community of communities) {
          const members = community.members || [];
          if (members.length === 0) continue;

          const postCount = Math.floor(Math.random() * 10) + 5;
          for (let i = 0; i < postCount; i++) {
            const randomMember = members[Math.floor(Math.random() * members.length)];
            const useVietnamese = Math.random() > 0.2; // 80% tiếng Việt
            const post = BlogPostFactory.createCommunityPost(
              randomMember.user,
              community,
              {},
              useVietnamese,
            );

            post.hashtags = this.getRandomHashtags(hashtags, Math.floor(Math.random() * 4) + 1);
            const savedPost = await communityPostRepository.save(post);
            allCreatedPostIds.push(Number(savedPost.id));

            await this.addBlocksToPost(
              savedPost,
              textBlockRepository,
              imageBlockRepository,
              useVietnamese,
            );
            
            // Extract users from members for comments
            const memberUsers = members.map(m => m.user);
            await this.addCommentsToPost(
              savedPost,
              memberUsers,
              postCommentRepository,
              childCommentRepository,
              useVietnamese,
            );

            // Use community emojis for reactions
            const communityEmojis = community.emojis?.length > 0 ? community.emojis : allEmojis;
            if (communityEmojis.length > 0) {
              await this.addReactionsToPost(
                savedPost,
                memberUsers,
                communityEmojis,
                postReactRepository,
              );
            }

            communityPostCount++;
          }
        }
        this.success(`Created ${communityPostCount} community blog posts`);
      }

      // 3. Create Repost Blog Posts
      console.log('  🔄 Creating repost blog posts...');
      let repostCount = 0;
      if (allCreatedPostIds.length > 0) {
        for (const user of users.slice(0, 20)) {
          const repostAmount = Math.floor(Math.random() * 3) + 1;
          const originalPostIds = this.getRandomItems(allCreatedPostIds, repostAmount);
          const useVietnamese = Math.random() > 0.5;

          const reposts = BlogPostFactory.createRepostBatch(user, originalPostIds, useVietnamese);

          for (const repost of reposts) {
            repost.hashtags = this.getRandomHashtags(hashtags, Math.floor(Math.random() * 3) + 1);
            const savedRepost = await repostRepository.save(repost);

            // Reposts có ít blocks hơn
            await this.addBlocksToPost(
              savedRepost,
              textBlockRepository,
              imageBlockRepository,
              useVietnamese,
              2,
            );

            // Add comments
            await this.addCommentsToPost(
              savedRepost,
              users,
              postCommentRepository,
              childCommentRepository,
              useVietnamese,
            );

            if (allEmojis.length > 0) {
              await this.addReactionsToPost(savedRepost, users, allEmojis, postReactRepository);
            }

            repostCount++;
          }
        }
        this.success(`Created ${repostCount} repost blog posts`);
      }

      this.success(
        `✓ Total: ${personalPostCount + communityPostCount + repostCount} blog posts with comments and reactions`,
      );
    } catch (error) {
      this.error('Failed to seed blog posts', error);
      throw error;
    }
  }

  // Helper methods
  private getRandomHashtags(hashtags: Hashtag[], count: number): Hashtag[] {
    const selected: Hashtag[] = [];
    const used = new Set<number>();

    while (selected.length < count && selected.length < hashtags.length) {
      const random = hashtags[Math.floor(Math.random() * hashtags.length)];
      if (!used.has(random.id)) {
        selected.push(random);
        used.add(random.id);
      }
    }

    return selected;
  }

  private getRandomItems<T>(items: T[], count: number): T[] {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, items.length));
  }

  private async addBlocksToPost(
    post: PersonalBlogPost | CommunityBlogPost | RepostBlogPost,
    textBlockRepository: Repository<TextBlock>,
    imageBlockRepository: Repository<ImageBlock>,
    useVietnamese: boolean,
    maxBlocks = 5,
  ): Promise<void> {
    const fakerInstance = useVietnamese ? fakerVi : faker;
    const blockCount = Math.floor(Math.random() * maxBlocks) + 2;

    for (let i = 0; i < blockCount; i++) {
      if (Math.random() > 0.4) {
        // 60% Text blocks
        const textBlock = new TextBlock();
        textBlock.post = post;
        textBlock.x = 0;
        textBlock.y = i * 100;
        textBlock.width = 800;
        textBlock.height = 200;
        textBlock.text = fakerInstance.lorem.paragraphs(Math.floor(Math.random() * 3) + 1);
        await textBlockRepository.save(textBlock);
      } else {
        // 40% Image blocks
        const imageBlock = new ImageBlock();
        imageBlock.post = post;
        imageBlock.x = 0;
        imageBlock.y = i * 100;
        imageBlock.width = 800;
        imageBlock.height = 400;
        imageBlock.imageUrl = fakerInstance.image.url();
        await imageBlockRepository.save(imageBlock);
      }
    }
  }

  private async addCommentsToPost(
    post: PersonalBlogPost | CommunityBlogPost | RepostBlogPost,
    users: NormalUser[],
    postCommentRepository: Repository<PostComment>,
    childCommentRepository: Repository<ChildComment>,
    useVietnamese: boolean,
  ): Promise<void> {
    const commentCount = Math.floor(Math.random() * 10) + 2; // 2-12 comments
    const commenters = this.getRandomItems(users, Math.min(commentCount, users.length));

    const comments = CommentFactory.createPostCommentBatch(
      commenters,
      post,
      commentCount,
      useVietnamese,
    );

    for (const comment of comments) {
      const savedComment = await postCommentRepository.save(comment);

      // 40% chance to have child comments (replies)
      if (Math.random() > 0.6) {
        const childCount = Math.floor(Math.random() * 5) + 1;
        const childComments = CommentFactory.createChildCommentBatch(
          users,
          savedComment,
          childCount,
          useVietnamese,
        );
        await childCommentRepository.save(childComments);
      }
    }
  }

  private async addReactionsToPost(
    post: PersonalBlogPost | CommunityBlogPost | RepostBlogPost,
    users: NormalUser[],
    emojis: Emoji[],
    postReactRepository: Repository<PostUserReact>,
  ): Promise<void> {
    const reactCount = Math.floor(Math.random() * 15) + 3; // 3-18 reactions
    const reactingUsers = this.getRandomItems(users, Math.min(reactCount, users.length));

    const reactions = UserReactFactory.createPostReactBatch(
      reactingUsers,
      post,
      emojis,
      reactCount,
    );

    if (reactions.length > 0) {
      await postReactRepository.save(reactions);
    }
  }
}
