import { DataSource } from 'typeorm';
import { Seeder } from '../seeder.base';
import { SavedPostList } from '../../saved-post-list/entities/saved-post-list.entity';
import { SavedPostListItem } from '../../saved-post-list/entities/saved-post-list-item.entity';
import { User } from '../../users/entities/user.entity';
import { BlogPost } from '../../blog-posts/entities/blog-post.entity';

export class SavedPostListSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    console.log('🌱 Seeding Saved Post Lists...');

    const savedPostListRepository = this.dataSource.getRepository(SavedPostList);
    const savedPostListItemRepository = this.dataSource.getRepository(SavedPostListItem);
    const userRepository = this.dataSource.getRepository(User);
    const blogPostRepository = this.dataSource.getRepository(BlogPost);

    try {
      const users = await userRepository.find();
      const blogPosts = await blogPostRepository.find();

      if (users.length === 0) {
        this.error('No users found. Please run UserSeeder first.');
        return;
      }

      if (blogPosts.length === 0) {
        this.error('No blog posts found. Please run BlogPostSeeder first.');
        return;
      }

      let totalLists = 0;
      let totalItems = 0;

      // 60% of users have saved post lists
      const usersWithLists = users.filter(() => Math.random() > 0.4);

      for (const user of usersWithLists) {
        const savedPostList = new SavedPostList();
        savedPostList.user = user;

        const createdList = await savedPostListRepository.save(savedPostList);
        totalLists++;

        // Each user saves 3-15 posts
        const savedCount = Math.floor(Math.random() * 13) + 3;
        const shuffledPosts = [...blogPosts].sort(() => Math.random() - 0.5);
        const postsToSave = shuffledPosts.slice(0, savedCount);

        for (const post of postsToSave) {
          const item = new SavedPostListItem();
          item.savedPostList = createdList;
          item.post = post;
          await savedPostListItemRepository.save(item);
          totalItems++;
        }
      }

      this.success(`Created ${totalLists} saved post lists with ${totalItems} items`);
    } catch (error) {
      this.error('Failed to seed saved post lists', error);
      throw error;
    }
  }
}
