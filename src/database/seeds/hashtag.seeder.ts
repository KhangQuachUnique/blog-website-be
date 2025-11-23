import { DataSource } from 'typeorm';
import { Seeder } from '../seeder.base';
import { HashtagFactory } from '../factories/hashtag.factory';
import { Hashtag } from '../../hashtags/entities/hashtag.entity';

export class HashtagSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    console.log('🌱 Seeding Hashtags...');

    const hashtagRepository = this.dataSource.getRepository(Hashtag);

    try {
      // Create common hashtags
      const commonHashtags = HashtagFactory.createCommonHashtags();
      await hashtagRepository.save(commonHashtags);
      this.success(`Created ${commonHashtags.length} common hashtags`);

      // Create random hashtags
      const randomHashtags = HashtagFactory.createBatch(30);
      await hashtagRepository.save(randomHashtags);
      this.success(`Created ${randomHashtags.length} random hashtags`);

      this.success('✓ Hashtags seeded successfully');
    } catch (error) {
      this.error('Failed to seed hashtags', error);
      throw error;
    }
  }
}
