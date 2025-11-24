import { faker } from '@faker-js/faker';
import { Community } from '../../communities/entities/community.entity';

export class CommunityFactory {
  static create(override: Partial<Community> = {}): Community {
    const community = new Community();

    community.name = override.name || faker.company.name();
    community.description = override.description || faker.lorem.paragraphs(2);
    community.thumbnailUrl = override.thumbnailUrl || faker.image.url();
    community.isPublic =
      override.isPublic !== undefined ? override.isPublic : faker.datatype.boolean();

    return community;
  }

  static createBatch(count: number): Community[] {
    return Array.from({ length: count }, () => this.create());
  }
}
