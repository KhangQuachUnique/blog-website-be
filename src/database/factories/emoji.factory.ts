import { faker } from '@faker-js/faker';
import { Emoji } from '../../emojis/entities/emoji.entity';
import { Community } from '../../communities/entities/community.entity';

export class EmojiFactory {
  static create(community: Community, override: Partial<Emoji> = {}): Emoji {
    const emoji = new Emoji();

    const emojis = [
      '😀',
      '😂',
      '❤️',
      '👍',
      '🔥',
      '🎉',
      '💯',
      '🚀',
      '⭐',
      '👏',
      '💪',
      '🎯',
      '✨',
      '🌟',
      '💡',
    ];
    emoji.emojiUrl = override.emojiUrl || faker.helpers.arrayElement(emojis);
    emoji.community = community;

    return emoji;
  }

  static createBatch(community: Community, count: number): Emoji[] {
    return Array.from({ length: count }, () => this.create(community));
  }
}
