import { faker } from '@faker-js/faker';
import { Hashtag } from '../../hashtags/entities/hashtag.entity';

export class HashtagFactory {
  static create(override: Partial<Hashtag> = {}): Hashtag {
    const hashtag = new Hashtag();

    hashtag.name = override.name || faker.word.noun();

    return hashtag;
  }

  static createBatch(count: number): Hashtag[] {
    // Ensure unique hashtag names
    const names = new Set<string>();
    const hashtags: Hashtag[] = [];

    while (hashtags.length < count) {
      const name = faker.word.noun();
      if (!names.has(name)) {
        names.add(name);
        hashtags.push(this.create({ name }));
      }
    }

    return hashtags;
  }

  static createCommonHashtags(): Hashtag[] {
    const commonTags = [
      'javascript',
      'typescript',
      'nodejs',
      'react',
      'angular',
      'vue',
      'python',
      'java',
      'csharp',
      'php',
      'programming',
      'webdev',
      'coding',
      'tech',
      'ai',
    ];

    return commonTags.map((name) => this.create({ name }));
  }
}
