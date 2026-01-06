import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { UserSeeder } from './seeds/user.seeder';
import { HashtagSeeder } from './seeds/hashtag.seeder';
import { CommunitySeeder } from './seeds/community.seeder';
import { EmojiSeeder } from './seeds/emoji.seeder';
import { BlogPostSeeder } from './seeds/blog-post-complete.seeder';
import { SavedPostListSeeder } from './seeds/saved-post-list.seeder';
import { NotificationSeeder } from './seeds/notification.seeder';
import { ReportSeeder } from './seeds/report.seeder';
import { UserVoteSeeder } from './seeds/user-vote.seeder';

async function runSeeders() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Initialize database connection
    console.log('📦 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✓ Database connected successfully\n');

    // Run seeders in order (respecting dependencies)
    const seeders = [
      new UserSeeder(AppDataSource), // 1. Users first
      new HashtagSeeder(AppDataSource), // 2. Hashtags
      new CommunitySeeder(AppDataSource), // 3. Communities
      new EmojiSeeder(AppDataSource), // 4. Emojis (depends on communities)
      new BlogPostSeeder(AppDataSource), // 5. Blog Posts with Comments & Reactions
      new UserVoteSeeder(AppDataSource), // 6. User Votes (depends on users & blog posts)
      new SavedPostListSeeder(AppDataSource), // 7. Saved Post Lists
      new NotificationSeeder(AppDataSource), // 8. Notifications
      new ReportSeeder(AppDataSource), // 9. Reports (depends on posts/comments/users)
    ];

    for (const seeder of seeders) {
      await seeder.run();
      console.log('');
    }

    console.log('✅ All seeders completed successfully!');
    console.log('🎉 Database seeding finished!\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('📦 Database connection closed');
    }
  }
}

// Run the seeders
runSeeders();
