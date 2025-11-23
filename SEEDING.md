# Database Seeding

## 📖 Tổng quan

Hệ thống seeding này cho phép bạn tạo dữ liệu mẫu cho toàn bộ project một cách nhanh chóng và dễ dàng.

## 🚀 Cách sử dụng

### Seed toàn bộ database

```bash
npm run seed
```

Lệnh này sẽ tạo:

- 1 admin user (username: `admin`, password: `password123`)
- 50 normal users với thông tin ngẫu nhiên
- Quan hệ follow giữa các users
- 15 communities với members
- Common hashtags (javascript, typescript, react, etc.)
- Personal blog posts cho 30 users đầu tiên
- Community blog posts cho các communities
- Text và Image blocks cho mỗi post
- Emojis cho mỗi community

### Xóa toàn bộ dữ liệu trong database

```bash
npm run seed:clear
```

⚠️ **Cảnh báo**: Lệnh này sẽ xóa toàn bộ dữ liệu trong database!

### Reset và seed lại

```bash
npm run seed:clear ; npm run seed
```

## 📁 Cấu trúc thư mục

```
src/database/
├── data-source.ts          # TypeORM DataSource configuration
├── seeder.base.ts          # Base class cho tất cả seeders
├── seed.ts                 # Main seeder script
├── clear.ts                # Database cleanup script
├── factories/              # Factory pattern để tạo fake data
│   ├── user.factory.ts
│   ├── community.factory.ts
│   ├── blog-post.factory.ts
│   ├── hashtag.factory.ts
│   └── emoji.factory.ts
└── seeds/                  # Seeder files
    ├── user.seeder.ts
    ├── community.seeder.ts
    ├── hashtag.seeder.ts
    └── blog-post.seeder.ts
```

## 🔧 Kỹ thuật sử dụng

### 1. Factory Pattern

Sử dụng factories để tạo fake data với Faker.js:

```typescript
const user = UserFactory.createNormalUser({
  username: 'custom_username',
  email: 'custom@email.com',
});
```

### 2. Seeder Classes

Mỗi seeder kế thừa từ `Seeder` base class:

```typescript
export class UserSeeder extends Seeder {
  async run(): Promise<void> {
    // Seeding logic here
  }
}
```

### 3. Dependencies

Seeders được chạy theo thứ tự để đảm bảo foreign key constraints:

1. Users
2. Hashtags
3. Communities
4. Blog Posts (phụ thuộc vào Users, Communities, Hashtags)

## 🎨 Tùy chỉnh

### Thêm seeder mới

1. Tạo factory trong `src/database/factories/`:

```typescript
export class YourEntityFactory {
  static create(override: Partial<YourEntity> = {}): YourEntity {
    // Factory logic
  }
}
```

2. Tạo seeder trong `src/database/seeds/`:

```typescript
export class YourEntitySeeder extends Seeder {
  async run(): Promise<void> {
    // Seeding logic
  }
}
```

3. Thêm vào main seeder (`src/database/seed.ts`):

```typescript
const seeders = [
  // ... existing seeders
  new YourEntitySeeder(AppDataSource),
];
```

## 📝 Lưu ý

- Mật khẩu mặc định cho tất cả users: `password123` (đã hash bằng bcrypt)
- Admin username: `admin`, email: `admin@blog.com`
- Dữ liệu được tạo ngẫu nhiên nhưng có logic (ví dụ: members của community sẽ tạo posts trong community đó)
- Sử dụng Faker.js để tạo dữ liệu realistic

## 🛠 Troubleshooting

Nếu gặp lỗi kết nối database:

- Kiểm tra connection string trong `src/database/data-source.ts`
- Đảm bảo database đang chạy
- Kiểm tra credentials

Nếu gặp lỗi foreign key:

- Chạy `npm run seed:clear` trước
- Đảm bảo seeders chạy đúng thứ tự
