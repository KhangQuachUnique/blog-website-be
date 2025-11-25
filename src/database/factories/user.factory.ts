import { faker } from '@faker-js/faker';
import { NormalUser } from '../../users/entities/normal-user.entity';
import { AdminUser } from '../../users/entities/admin-user.entity';
import { EGender } from '../../users/enums/gender.enum';

export class UserFactory {
  static createNormalUser(override: Partial<NormalUser> = {}): NormalUser {
    const user = new NormalUser();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    user.username = override.username || faker.internet.username({ firstName, lastName });
    user.email = override.email || faker.internet.email({ firstName, lastName });
    user.password =
      override.password || '$2b$10$XQhbQdCZdKzY1YqWQvGhgOxKZqLXqYZKH1ZpZqMqZ1ZpZqMqZ1Zpq'; // hashed "password123"
    user.phoneNumber = override.phoneNumber || faker.phone.number();
    user.bio = override.bio || faker.lorem.paragraph();
    user.avatarUrl = override.avatarUrl || faker.image.avatar();
    user.dob = override.dob || faker.date.birthdate({ min: 18, max: 65, mode: 'age' });
    user.gender = override.gender || faker.helpers.enumValue(EGender);

    return user;
  }

  static createAdminUser(override: Partial<AdminUser> = {}): AdminUser {
    const user = new AdminUser();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    user.username =
      override.username || `admin_${faker.internet.username({ firstName, lastName })}`;
    user.email = override.email || faker.internet.email({ firstName, lastName });
    user.password =
      override.password || '$2b$10$XQhbQdCZdKzY1YqWQvGhgOxKZqLXqYZKH1ZpZqMqZ1ZpZqMqZ1Zpq';
    user.phoneNumber = override.phoneNumber || faker.phone.number();
    user.bio = override.bio || 'System Administrator';
    user.avatarUrl = override.avatarUrl || faker.image.avatar();
    user.dob = override.dob || faker.date.birthdate({ min: 25, max: 50, mode: 'age' });
    user.gender = override.gender || faker.helpers.enumValue(EGender);

    return user;
  }

  static createBatch(count: number): NormalUser[] {
    return Array.from({ length: count }, () => this.createNormalUser());
  }
}
