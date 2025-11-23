import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function clearDatabase() {
  console.log('🗑️  Starting database cleanup...\n');

  try {
    // Initialize database connection
    console.log('📦 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✓ Database connected successfully\n');

    // Get all table names
    const entities = AppDataSource.entityMetadatas;

    // Disable foreign key checks
    await AppDataSource.query('SET session_replication_role = replica;');

    // Clear all tables
    for (const entity of entities) {
      const repository = AppDataSource.getRepository(entity.name);
      await repository.clear();
      console.log(`✓ Cleared table: ${entity.tableName}`);
    }

    // Re-enable foreign key checks
    await AppDataSource.query('SET session_replication_role = DEFAULT;');

    console.log('\n✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('📦 Database connection closed');
    }
  }
}

// Run the cleanup
clearDatabase();
