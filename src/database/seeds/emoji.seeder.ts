import { DataSource } from 'typeorm';
import { Seeder } from '../seeder.base';
import { Emoji } from '../../emojis/entities/emoji.entity';
import { EEmojiType } from '../../emojis/enums/emoji.enum';
import { Community } from '../../communities/entities/community.entity';
import { EmojiFactory } from '../factories/emoji.factory';
import * as fs from 'fs';
import * as path from 'path';

interface EmojiObject {
  emoji: string;
  name: string;
  codepoint: string;
  twemoji_url: string;
  group: string;
}

interface EmojiData {
  [category: string]: EmojiObject[];
}

export class EmojiSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    console.log('🌱 Seeding Emojis...');

    const emojiRepository = this.dataSource.getRepository(Emoji);
    const communityRepository = this.dataSource.getRepository(Community);

    try {
      // 1. Insert all Unicode emojis from JSON file
      const jsonPath = path.join(__dirname, '../assets/twemoji_valid_by_category.json');
      const emojiData: EmojiData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

      const unicodeEmojis: Emoji[] = [];

      for (const [category, emojiObjects] of Object.entries(emojiData)) {
        for (const emojiObj of emojiObjects) {
          const emoji = new Emoji();
          emoji.type = EEmojiType.UNICODE;
          emoji.codepoint = emojiObj.codepoint; // Extract codepoint from object
          emoji.emojiUrl = null;
          emoji.community = null;
          unicodeEmojis.push(emoji);
        }
      }

      await emojiRepository.save(unicodeEmojis);
      this.success(`Created ${unicodeEmojis.length} Unicode emojis from JSON file`);

      // 2. Create custom emojis for each community
      const communities = await communityRepository.find();

      if (communities.length === 0) {
        this.log('No communities found. Skipping custom emoji creation.');
        return;
      }

      let totalCustomEmojis = 0;

      for (const community of communities) {
        // Each community gets 5-10 custom emojis
        const emojiCount = Math.floor(Math.random() * 6) + 5;
        const customEmojis = EmojiFactory.createBatch(community, emojiCount);

        await emojiRepository.save(customEmojis);
        totalCustomEmojis += customEmojis.length;
      }

      this.success(
        `Created ${totalCustomEmojis} custom emojis for ${communities.length} communities`,
      );
      this.success(`Total emojis: ${unicodeEmojis.length + totalCustomEmojis}`);
    } catch (error) {
      this.error('Failed to seed emojis', error);
      throw error;
    }
  }
}
