import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function fixSchema() {
  console.log('🔧 Fixing database schema...\n');

  try {
    console.log('📦 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✓ Database connected successfully\n');

    // Make savedPostListId nullable for AdminUser compatibility
    console.log('Altering savedPostListId column to be nullable...');
    await AppDataSource.query('ALTER TABLE users ALTER COLUMN "savedPostListId" DROP NOT NULL;');
    console.log('✓ Column altered successfully\n');

    console.log('✅ Schema fixed successfully!');
  } catch (error) {
    console.error('❌ Error during schema fix:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('📦 Database connection closed');
    }
  }
}

fixSchema();
