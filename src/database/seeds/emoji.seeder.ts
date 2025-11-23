import { DataSource } from 'typeorm';
import { Seeder } from '../seeder.base';
import { Emoji } from '../../emojis/entities/emoji.entity';
import { EmojiFactory } from '../factories/emoji.factory';
import { Community } from '../../communities/entities/community.entity';

export class EmojiSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    console.log('🌱 Seeding Emojis...');

    const emojiRepository = this.dataSource.getRepository(Emoji);
    const communityRepository = this.dataSource.getRepository(Community);

    try {
      const communities = await communityRepository.find();

      if (communities.length === 0) {
        this.error('No communities found. Please run CommunitySeeder first.');
        return;
      }

      let totalEmojis = 0;

      for (const community of communities) {
        // Each community gets 5-10 emojis
        const emojiCount = Math.floor(Math.random() * 6) + 5;
        const emojis = EmojiFactory.createBatch(community, emojiCount);

        await emojiRepository.save(emojis);
        totalEmojis += emojis.length;
      }

      this.success(`Created ${totalEmojis} emojis for ${communities.length} communities`);
    } catch (error) {
      this.error('Failed to seed emojis', error);
      throw error;
    }
  }
}
