# 🏗️ USER-REACT MODULE - PRODUCTION-READY ARCHITECTURE

## 📁 Cấu trúc thư mục (Clean Architecture)

```
user-reacts/
├── entities/
│   └── user-react.entity.ts              # ✅ Domain model + DB constraints
├── dto/
│   ├── toggle-react.dto.ts               # ✅ Input validation
│   └── response/
│       └── user-react-summary.dto.ts     # ✅ Response structure
├── services/
│   ├── user-react-command.service.ts     # ✅ Write operations (toggle)
│   └── user-react-query.service.ts       # ✅ Read operations (aggregate)
├── user-reacts.controller.new.ts         # ✅ RESTful endpoints
└── user-reacts.module.new.ts             # ✅ Module configuration
```

---

## 🎯 1. Entity Design

### ✅ Thay đổi chính:
```typescript
// ❌ CŨ: Unique trên (user, type, post, comment)
@Unique('UQ_user_react_user_target', ['user', 'type', 'post', 'comment'])

// ✅ MỚI: Unique riêng cho post và comment
@Unique('UQ_user_react_post', ['user', 'post', 'emoji'])
@Unique('UQ_user_react_comment', ['user', 'comment', 'emoji'])
```

### 🔍 Lý do:
- **Discord behavior**: 1 user có thể react NHIỀU emoji khác nhau cho 1 target
- **DB enforcement**: Unique constraint tự động reject duplicate, không cần check bằng code
- **Indexes**: Optimize queries theo post/comment/emoji

---

## 🎯 2. CQRS Pattern (Command/Query Separation)

### 📝 Command Service - Write Operations
```typescript
class UserReactCommandService {
  toggleReactForPost(dto)    // Tạo/xóa reaction cho post
  toggleReactForComment(dto) // Tạo/xóa reaction cho comment
}
```

**Design principles:**
- ✅ Dùng `insert` + `delete` (nhanh hơn `save`)
- ✅ Để DB unique handle duplicates (không check trước)
- ✅ Code ngắn, không if/else phức tạp
- ✅ Catch unique violation (23505) để handle race condition

### 🔍 Query Service - Read Operations
```typescript
class UserReactQueryService {
  getUserReactForPost(postId, userId)       // Single post
  getUserReactForPosts(postIds, userId)     // Batch posts
  getUserReactForComment(commentId, userId) // Single comment
  getUserReactForComments(commentIds, userId) // Batch comments
}
```

**Design principles:**
- ✅ **Information Expert**: user-react module biết về reactions
- ✅ **Low Coupling**: Các module khác CHỈ gọi QueryService
- ✅ **Batch queries**: Optimize N+1 problem (newsfeed scenario)
- ✅ **Index usage**: WHERE post_id, comment_id, emoji_id đều có index
- ✅ **Aggregation**: GROUP BY emoji, maintain order by first appearance

---

## 🎯 3. DTOs với Validation

### Input DTO:
```typescript
class ToggleReactDto {
  @IsNumber() userId: number;
  @IsNumber() emojiId: number;
  @ValidateIf(o => !o.commentId) postId?: number;
  @ValidateIf(o => !o.postId) commentId?: number;
}
```

**Validation:**
- ✅ `class-validator` decorators
- ✅ Mutually exclusive: postId HOẶC commentId
- ✅ Swagger documentation tự động

### Response DTO:
```typescript
class UserReactSummaryDto {
  targetId: number;
  targetType: 'post' | 'comment';
  emojis: EmojiSummaryDto[];      // ✅ Grouped by emoji
  totalReactions: number;
}

class EmojiSummaryDto {
  emojiId: number;
  type: 'unicode' | 'custom';
  codepoint?: string;
  emojiUrl?: string;
  totalCount: number;               // ✅ Số người react
  reactedByCurrentUser: boolean;    // ✅ User hiện tại đã react chưa
}
```

---

## 🎯 4. Controller Design (RESTful)

### Endpoints:
```typescript
POST   /user-reacts/posts/toggle        // Toggle react cho post
POST   /user-reacts/comments/toggle     // Toggle react cho comment
GET    /user-reacts/posts/:postId       // Lấy reactions của 1 post
GET    /user-reacts/comments/:commentId // Lấy reactions của 1 comment
GET    /user-reacts/posts/batch         // Batch query nhiều posts
```

**Design principles:**
- ✅ RESTful naming rõ ràng
- ✅ Không business logic (chỉ mapping DTO)
- ✅ Swagger documentation đầy đủ
- ✅ ParseIntPipe validation

---

## 🎯 5. Module Exports (QUAN TRỌNG!)

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([UserReact])],
  providers: [UserReactCommandService, UserReactQueryService],
  exports: [UserReactQueryService], // ✅ CHỈ export QueryService
})
export class UserReactsModule {}
```

### 🔍 Lý do:
- ✅ **Low Coupling**: Các module khác CHỈ phụ thuộc vào QueryService
- ✅ **Information Expert**: user-react module là expert về reactions
- ❌ **KHÔNG export CommandService**: Write operations chỉ qua HTTP API

### 📝 Cách dùng trong module khác:

```typescript
// blog-posts.service.ts
@Injectable()
export class BlogPostsService {
  constructor(
    private readonly userReactQuery: UserReactQueryService, // ✅ Inject QueryService
  ) {}

  async getPostDetail(postId: number, currentUserId: number) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    
    // ✅ Lấy reactions qua QueryService
    const reactions = await this.userReactQuery.getUserReactForPost(
      postId,
      currentUserId,
    );

    return { ...post, reactions };
  }

  async getNewsfeed(userId: number) {
    const posts = await this.postRepo.find({ take: 20 });
    const postIds = posts.map(p => p.id);
    
    // ✅ Batch query reactions (1 query thay vì 20 queries)
    const reactionsMap = await this.userReactQuery.getUserReactForPosts(
      postIds,
      userId,
    );

    return posts.map(post => ({
      ...post,
      reactions: reactionsMap.get(post.id),
    }));
  }
}
```

---

## 🎯 6. GRASP Principles Applied

### 📋 Information Expert
- **UserReact entity** là expert về reactions data
- **UserReactQueryService** là expert về aggregating reactions
- Các module khác KHÔNG biết về bảng `user_reacts`

### 🔗 Low Coupling
- BlogPostService, CommentService không query trực tiếp bảng reactions
- Chỉ phụ thuộc vào interface `UserReactQueryService`
- Dễ thay đổi implementation sau này (cache, Redis, etc.)

### 🎯 Controller (Pure Fabrication)
- Không domain object thực sự
- Chỉ coordination giữa HTTP ↔ Service
- Không business logic

---

## 🎯 7. Query Optimization

### Index Strategy:
```sql
CREATE INDEX IDX_user_react_post ON user_reacts(post_id);
CREATE INDEX IDX_user_react_comment ON user_reacts(comment_id);
CREATE INDEX IDX_user_react_emoji ON user_reacts(emoji_id);
```

### Query Pattern:
```typescript
// ✅ Single query với JOIN
const reactions = await this.userReactRepo
  .createQueryBuilder('react')
  .leftJoinAndSelect('react.emoji', 'emoji')
  .leftJoinAndSelect('react.user', 'user')
  .where('react.post_id = :postId', { postId })
  .orderBy('react.createdAt', 'ASC') // Maintain order
  .getMany();
```

**Performance:**
- ✅ Single query thay vì N+1
- ✅ Dùng index trên post_id/comment_id
- ✅ Batch query cho newsfeed (20 posts = 1 query)

---

## 🎯 8. Extensibility (Dễ mở rộng)

### Thêm target mới (VD: Message, Image):
1. Update Entity:
```typescript
@ManyToOne(() => Message, { onDelete: 'CASCADE', nullable: true })
message: Message | null;

@Unique('UQ_user_react_message', ['user', 'message', 'emoji'])
```

2. Add methods trong Service:
```typescript
async toggleReactForMessage(dto) { ... }
async getUserReactForMessage(messageId, userId) { ... }
```

3. Add endpoint trong Controller:
```typescript
@Post('messages/toggle')
async toggleMessageReact(@Body() dto: ToggleReactDto) { ... }
```

**Không cần sửa:**
- ✅ Aggregation logic (reusable)
- ✅ DTO structure
- ✅ Các module khác (BlogPost, Comment)

---

## 🎯 9. Migration Guide

### Step 1: Update Entity
```bash
# Chạy migration để update constraints
npm run migration:generate -- src/database/migrations/UpdateUserReactConstraints
npm run migration:run
```

### Step 2: Replace Module
```typescript
// Đổi tên file
mv user-reacts.module.new.ts user-reacts.module.ts
mv user-reacts.controller.new.ts user-reacts.controller.ts
```

### Step 3: Update các module khác
```typescript
// blog-posts.module.ts
imports: [UserReactsModule] // ✅ Import module

// blog-posts.service.ts
constructor(
  private readonly userReactQuery: UserReactQueryService, // ✅ Inject
) {}
```

### Step 4: Test
```bash
# Test toggle reactions
POST /user-reacts/posts/toggle
Body: { userId: 1, emojiId: 5, postId: 10 }

# Test get reactions
GET /user-reacts/posts/10?userId=1

# Test batch query
GET /user-reacts/posts/batch?postIds=1,2,3&userId=1
```

---

## 🎯 10. Summary - Lợi ích thiết kế này

### ✅ Code Quality:
- **Clean**: Không if/else thừa, logic rõ ràng
- **Testable**: Tách command/query dễ test
- **Maintainable**: Thay đổi 1 chỗ, không ảnh hưởng module khác

### ✅ Performance:
- **DB enforcement**: Không check duplicate bằng code
- **Index optimization**: Query nhanh
- **Batch queries**: Giảm N+1 problem

### ✅ Architecture:
- **GRASP**: Information Expert + Low Coupling
- **CQRS**: Tách read/write rõ ràng
- **RESTful**: API design chuẩn

### ✅ Extensibility:
- Dễ thêm target mới (message, image...)
- Dễ cache (Redis layer trong QueryService)
- Dễ scale (read replicas cho QueryService)

---

## 📝 Notes

1. **Tại sao không dùng TypeORM Repository pattern?**
   - QueryBuilder linh hoạt hơn cho aggregation
   - Control được SQL query chính xác
   - Dễ optimize performance

2. **Tại sao tách Command/Query Service?**
   - CQRS: Read và Write có requirements khác nhau
   - Query có thể cache, scale riêng
   - Command có thể queue, retry logic

3. **Tại sao chỉ export QueryService?**
   - Write operations qua HTTP API (có auth, validation)
   - Tránh module khác bypass business rules
   - Enforce single source of truth

---

Thiết kế này là **production-ready**, áp dụng đúng Clean Architecture + GRASP, và dễ scale trong tương lai! 🚀
