import { DataSource } from 'typeorm';
import { Seeder } from '../seeder.base';
import { CommunityFactory } from '../factories/community.factory';
import { EmojiFactory } from '../factories/emoji.factory';
import { Community } from '../../communities/entities/community.entity';
import { NormalUser } from '../../users/entities/normal-user.entity';
import { Emoji } from '../../emojis/entities/emoji.entity';
import { CommunityMember } from '../../communities/entities/community-member.entity';
import { ECommunityRole } from '../../communities/enums/community-role.enum';

export class CommunitySeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    console.log('🌱 Seeding Communities...');

    const communityRepository = this.dataSource.getRepository(Community);
    const userRepository = this.dataSource.getRepository(NormalUser);
    const emojiRepository = this.dataSource.getRepository(Emoji);
    const memberRepository = this.dataSource.getRepository(CommunityMember);

    try {
      // Get all users
      const users = await userRepository.find();
      if (users.length === 0) {
        this.error('No users found. Please run UserSeeder first.');
        return;
      }

      // Create communities
      const communities = CommunityFactory.createBatch(15);
      const savedCommunities = await communityRepository.save(communities);
      this.success(`Created ${savedCommunities.length} communities`);

      // Add members to communities
      for (const community of savedCommunities) {
        const memberCount = Math.floor(Math.random() * 20) + 5; // 5-25 members
        const communityMembers: CommunityMember[] = [];

        for (let i = 0; i < memberCount; i++) {
          const randomUser = users[Math.floor(Math.random() * users.length)];
          if (!communityMembers.find((m) => m.user.id === randomUser.id)) {
            const member = new CommunityMember();
            member.community = community;
            member.user = randomUser;
            member.role = i === 0 ? ECommunityRole.ADMIN : ECommunityRole.MEMBER;
            communityMembers.push(member);
          }
        }

        await memberRepository.save(communityMembers);

        // Create emojis for community
        const emojis = EmojiFactory.createBatch(community, Math.floor(Math.random() * 5) + 3);
        await emojiRepository.save(emojis);
      }

      this.success('Added members to communities');
      this.success('Created emojis for communities');
      this.success('✓ Communities seeded successfully');
    } catch (error) {
      this.error('Failed to seed communities', error);
      throw error;
    }
  }
}
