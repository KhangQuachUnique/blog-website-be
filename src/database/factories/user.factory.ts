import { faker } from '@faker-js/faker';
import { User } from '../../users/entities/user.entity';
import { EGender } from '../../users/enums/gender.enum';
import { EUserRole } from '../../users/enums/role.enum';

export class UserFactory {
  static createNormalUser(override: Partial<User> = {}): User {
    const user = new User();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    user.username = override.username || faker.internet.username({ firstName, lastName });
    user.email = override.email || faker.internet.email({ firstName, lastName });
    user.password =
      override.password || '$2b$10$XQhbQdCZdKzY1YqWQvGhgOxKZqLXqYZKH1ZpZqMqZ1ZpZqMqZ1Zpq'; // hashed "password123"
    user.phoneNumber = override.phoneNumber || faker.phone.number();
    user.bio = override.bio || faker.lorem.paragraph();
    user.avatarUrl = override.avatarUrl || faker.image.avatar();
    user.coverImageUrl = override.coverImageUrl || faker.image.urlLoremFlickr({ category: 'nature' });
    user.dob = override.dob || faker.date.birthdate({ min: 18, max: 65, mode: 'age' });
    user.gender = override.gender || faker.helpers.enumValue(EGender);
    user.type = override.type || EUserRole.USER;

    return user;
  }

  static createAdminUser(override: Partial<User> = {}): User {
    const user = new User();
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
    user.coverImageUrl = override.coverImageUrl || faker.image.urlLoremFlickr({ category: 'city' });
    user.dob = override.dob || faker.date.birthdate({ min: 25, max: 50, mode: 'age' });
    user.gender = override.gender || faker.helpers.enumValue(EGender);
    user.type = override.type || EUserRole.ADMIN;

    return user;
  }

  static createBatch(count: number): User[] {
    return Array.from({ length: count }, () => this.createNormalUser());
  }
}
