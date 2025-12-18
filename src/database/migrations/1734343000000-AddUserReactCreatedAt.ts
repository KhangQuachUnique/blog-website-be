import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add createdAt column to user_reacts table
 * 
 * This field is needed for:
 * - Ordering reactions by time
 * - Showing "first to react" badge
 * - Analytics
 */
export class AddUserReactCreatedAt1734343000000 implements MigrationInterface {
  name = 'AddUserReactCreatedAt1734343000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add createdAt column with default to NOW()
    // Set default for existing rows, then change default to NOW() for new rows
    await queryRunner.query(`
      ALTER TABLE "user_reacts" 
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_reacts" 
      DROP COLUMN IF EXISTS "createdAt"
    `);
  }
}
