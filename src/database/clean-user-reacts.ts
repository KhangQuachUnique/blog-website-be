import { DataSource } from 'typeorm';

/**
 * Script clean data cũ trong bảng user_reacts trước khi apply entity mới
 * 
 * Run: ts-node -r tsconfig-paths/register src/database/clean-user-reacts.ts
 */
async function cleanUserReacts() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: 'postgresql://postgres.nhmlmwlvvrdabyikxvzo:kadfwfsfsvs@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
    database: 'postgres',
  });

  try {
    await dataSource.initialize();
    console.log('📦 Connected to database');

    // 1. Check current data
    const result = await dataSource.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE "emojiId" IS NULL) as null_emoji
      FROM "user_reacts"
    `);
    
    console.log('📊 Current data:', result[0]);
    
    if (result[0].null_emoji > 0) {
      console.log(`⚠️  Found ${result[0].null_emoji} rows with NULL emojiId`);
      
      // 2. Delete rows with null emoji
      await dataSource.query(`DELETE FROM "user_reacts" WHERE "emojiId" IS NULL`);
      console.log('✅ Deleted rows with NULL emojiId');
    }

    // 3. Drop old constraints
    await dataSource.query(`
      ALTER TABLE "user_reacts" 
      DROP CONSTRAINT IF EXISTS "UQ_user_react_user_target"
    `);
    console.log('✅ Dropped old unique constraint');

    // 4. Drop type column
    await dataSource.query(`
      ALTER TABLE "user_reacts" 
      DROP COLUMN IF EXISTS "type"
    `);
    console.log('✅ Dropped type column');

    // 5. Clean duplicate data (keep oldest reaction)
    await dataSource.query(`
      DELETE FROM "user_reacts" a
      USING "user_reacts" b
      WHERE a.id > b.id
        AND a."userId" = b."userId"
        AND a."emojiId" = b."emojiId"
        AND (
          (a."postId" = b."postId" AND a."postId" IS NOT NULL)
          OR
          (a."commentId" = b."commentId" AND a."commentId" IS NOT NULL)
        )
    `);
    console.log('✅ Cleaned duplicate reactions');

    console.log('✨ Clean completed! You can now restart your app.');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

cleanUserReacts();
