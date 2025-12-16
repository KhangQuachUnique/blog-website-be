import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Clean & Restructure user_reacts table
 * 
 * Changes:
 * 1. Remove 'type' column (replaced by nullable post/comment)
 * 2. Change unique constraints to (user, post, emoji) and (user, comment, emoji)
 * 3. Clean null emoji data
 * 4. Add indexes
 */
export class CleanUserReacts1734342000000 implements MigrationInterface {
  name = 'CleanUserReacts1734342000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Delete rows with null emoji (invalid data)
    await queryRunner.query(`
      DELETE FROM "user_reacts" WHERE "emojiId" IS NULL
    `);

    // 2. Drop old constraints
    await queryRunner.query(`
      ALTER TABLE "user_reacts" 
      DROP CONSTRAINT IF EXISTS "UQ_user_react_user_target"
    `);

    // 3. Drop type column if exists
    await queryRunner.query(`
      ALTER TABLE "user_reacts" 
      DROP COLUMN IF EXISTS "type"
    `);

    // 4. Create new unique constraints
    await queryRunner.query(`
      ALTER TABLE "user_reacts" 
      ADD CONSTRAINT "UQ_user_react_post" 
      UNIQUE ("userId", "postId", "emojiId")
    `);

    await queryRunner.query(`
      ALTER TABLE "user_reacts" 
      ADD CONSTRAINT "UQ_user_react_comment" 
      UNIQUE ("userId", "commentId", "emojiId")
    `);

    // 5. Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_react_post" 
      ON "user_reacts" ("postId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_react_comment" 
      ON "user_reacts" ("commentId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_react_emoji" 
      ON "user_reacts" ("emojiId")
    `);

    // 6. Set emojiId NOT NULL
    await queryRunner.query(`
      ALTER TABLE "user_reacts" 
      ALTER COLUMN "emojiId" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert changes
    await queryRunner.query(`
      ALTER TABLE "user_reacts" 
      ALTER COLUMN "emojiId" DROP NOT NULL
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_react_emoji"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_react_comment"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_react_post"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_reacts" 
      DROP CONSTRAINT IF EXISTS "UQ_user_react_comment"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_reacts" 
      DROP CONSTRAINT IF EXISTS "UQ_user_react_post"
    `);
  }
}
