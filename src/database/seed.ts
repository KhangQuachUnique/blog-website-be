import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { UserSeeder } from './seeds/user.seeder';
import { HashtagSeeder } from './seeds/hashtag.seeder';
import { CommunitySeeder } from './seeds/community.seeder';
import { BlogPostSeeder } from './seeds/blog-post.seeder';

async function runSeeders() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Initialize database connection
    console.log('📦 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✓ Database connected successfully\n');

    // Run seeders in order (respecting dependencies)
    const seeders = [
      new UserSeeder(AppDataSource),
      new HashtagSeeder(AppDataSource),
      new CommunitySeeder(AppDataSource),
      new BlogPostSeeder(AppDataSource),
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
