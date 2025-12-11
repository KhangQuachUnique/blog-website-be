import { faker } from '@faker-js/faker';
import { Emoji } from '../../emojis/entities/emoji.entity';
import { Community } from '../../communities/entities/community.entity';
import { EEmojiType } from '../../emojis/enums/emoji.enum';

export class EmojiFactory {
  static create(community: Community, override: Partial<Emoji> = {}): Emoji {
    const emoji = new Emoji();
    // Custom emojis for communities - use image URLs
    const emojiImages = [
      faker.image.urlLoremFlickr({ category: 'emoji' }),
      faker.image.urlLoremFlickr({ category: 'abstract' }),
      faker.image.urlLoremFlickr({ category: 'animals' }),
      faker.image.urlLoremFlickr({ category: 'business' }),
      faker.image.urlLoremFlickr({ category: 'food' }),
    ];

    emoji.type = override.type || EEmojiType.CUSTOM;
    emoji.emojiUrl = override.emojiUrl || faker.helpers.arrayElement(emojiImages);
    emoji.codepoint = override.codepoint || null;
    emoji.community = community;

    return emoji;
  }

  static createBatch(community: Community, count: number): Emoji[] {
    return Array.from({ length: count }, () => this.create(community));
  }
}
