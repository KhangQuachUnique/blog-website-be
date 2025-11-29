import { DataSource } from 'typeorm';
import { Seeder } from '../seeder.base';
import { UserFactory } from '../factories/user.factory';
import { User } from '../../users/entities/user.entity';
import { SavedPostList } from '../../saved-post-list/entities/saved-post-list.entity';

export class UserSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    console.log('🌱 Seeding Users...');

    const userRepository = this.dataSource.getRepository(User);
    const adminRepository = this.dataSource.getRepository(User);

    try {
      // Create admin users (AdminUser doesn't have SavedPostList requirement)
      const admin1 = UserFactory.createAdminUser({
        username: 'admin',
        email: 'admin@blog.com',
        password: '$2b$10$XQhbQdCZdKzY1YqWQvGhgOxKZqLXqYZKH1ZpZqMqZ1ZpZqMqZ1Zpq', // password123
      });

      const savedAdmins = await adminRepository.save([admin1]);
      this.success(`Created ${savedAdmins.length} admin users`);

      // Create normal users with SavedPostList
      const normalUsers = UserFactory.createBatch(50);

      // Create users with their SavedPostList
      const savedUsers: User[] = [];
      for (const user of normalUsers) {
        const savedPostList = new SavedPostList();
        savedPostList.user = user;
        user.savedPostList = savedPostList;

        const savedUser = await userRepository.save(user);
        savedUsers.push(savedUser);
      }

      this.success(`Created ${savedUsers.length} normal users with SavedPostLists`);

      // Create follow relationships (random)
      for (let i = 0; i < savedUsers.length; i++) {
        const user = savedUsers[i];
        const followCount = Math.floor(Math.random() * 10) + 1;

        const following: User[] = [];
        for (let j = 0; j < followCount; j++) {
          const randomUser = savedUsers[Math.floor(Math.random() * savedUsers.length)];
          if (randomUser.id !== user.id && !following.find((u) => u.id === randomUser.id)) {
            following.push(randomUser);
          }
        }

        user.following = following;
        await userRepository.save(user);
      }
      this.success(`Created follow relationships`);

      this.success('✓ Users seeded successfully');
    } catch (error) {
      this.error('Failed to seed users', error);
      throw error;
    }
  }
}
