# Hướng dẫn Backend: Interact Bar API

## 📋 Tổng quan

Document này hướng dẫn implement các API cho Interact Bar bao gồm:
- **Upvote/Downvote** - Vote bài viết
- **Emoji Reactions** - React với emoji
- **Report** - Báo cáo bài viết
- **Repost** - Đăng lại bài viết
- **Share** - Chia sẻ bài viết

---

## 🗄️ Database Schema hiện tại

### 1. BlogPost Entity
```typescript
// src/blog-posts/entities/blog-post.entity.ts
@Entity('blog_posts')
export abstract class BlogPost {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'int', default: 0 })
  upVotes: number;      // Số lượt upvote

  @Column({ type: 'int', default: 0 })
  downVotes: number;    // Số lượt downvote

  @ManyToOne('User')
  author: User;
  // ... other fields
}
```

### 2. UserReact Entity (Đã có)
```typescript
// src/user-reacts/entities/user-react.entity.ts
@Entity('user_reacts')
export class UserReact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: EReactTargetType })
  type: EReactTargetType;  // 'post' | 'comment'

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Emoji)
  emoji: Emoji;

  @ManyToOne(() => BlogPost)
  post: BlogPost;

  @ManyToOne(() => Comment)
  comment: Comment;
}
```

### 3. Report Entity (Đã có)
```typescript
// src/reports/entities/report.entity.ts
@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'enum', enum: EReportType })
  type: EReportType;  // 'USER' | 'POST' | 'COMMENT'

  @ManyToOne(() => User)
  reporter: User;

  @ManyToOne(() => BlogPost)
  reportedPost: BlogPost;
}
```

---

## 📝 Các API cần implement

### 1. UPVOTE / DOWNVOTE

#### 1.1 Tạo Entity mới: UserVote
```typescript
// src/user-votes/entities/user-vote.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';

export enum EVoteType {
  UPVOTE = 'upvote',
  DOWNVOTE = 'downvote',
}

@Entity('user_votes')
@Unique(['user', 'post'])  // Mỗi user chỉ vote 1 lần cho mỗi post
export class UserVote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: EVoteType })
  voteType: EVoteType;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => BlogPost, { onDelete: 'CASCADE' })
  post: BlogPost;
}
```

#### 1.2 DTO
```typescript
// src/user-votes/dto/create-vote.dto.ts
import { IsEnum, IsNumber } from 'class-validator';
import { EVoteType } from '../entities/user-vote.entity';

export class CreateVoteDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  postId: number;

  @IsEnum(EVoteType)
  voteType: EVoteType;
}
```

#### 1.3 Service
```typescript
// src/user-votes/user-votes.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserVote, EVoteType } from './entities/user-vote.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class UserVotesService {
  constructor(
    @InjectRepository(UserVote)
    private voteRepository: Repository<UserVote>,
    @InjectRepository(BlogPost)
    private postRepository: Repository<BlogPost>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Vote hoặc thay đổi vote cho bài viết
   */
  async vote(userId: number, postId: number, voteType: EVoteType) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) throw new NotFoundException('Post not found');

    // Tìm vote hiện tại của user
    const existingVote = await this.voteRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (existingVote) {
      // Nếu vote cùng loại -> xóa vote (toggle off)
      if (existingVote.voteType === voteType) {
        await this.voteRepository.remove(existingVote);
        // Cập nhật count
        if (voteType === EVoteType.UPVOTE) {
          post.upVotes = Math.max(0, post.upVotes - 1);
        } else {
          post.downVotes = Math.max(0, post.downVotes - 1);
        }
        await this.postRepository.save(post);
        return { message: 'Vote removed', voteType: null };
      }
      
      // Nếu vote khác loại -> đổi vote
      const oldVoteType = existingVote.voteType;
      existingVote.voteType = voteType;
      await this.voteRepository.save(existingVote);
      
      // Cập nhật count
      if (oldVoteType === EVoteType.UPVOTE) {
        post.upVotes = Math.max(0, post.upVotes - 1);
        post.downVotes += 1;
      } else {
        post.downVotes = Math.max(0, post.downVotes - 1);
        post.upVotes += 1;
      }
      await this.postRepository.save(post);
      return { message: 'Vote changed', voteType };
    }

    // Tạo vote mới
    const newVote = this.voteRepository.create({
      user,
      post,
      voteType,
    });
    await this.voteRepository.save(newVote);

    // Cập nhật count
    if (voteType === EVoteType.UPVOTE) {
      post.upVotes += 1;
    } else {
      post.downVotes += 1;
    }
    await this.postRepository.save(post);

    return { message: 'Vote added', voteType };
  }

  /**
   * Lấy vote status của user cho post
   */
  async getVoteStatus(userId: number, postId: number) {
    const vote = await this.voteRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });
    return { voteType: vote?.voteType || null };
  }
}
```

#### 1.4 Controller
```typescript
// src/user-votes/user-votes.controller.ts
import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { UserVotesService } from './user-votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';

@Controller('votes')
export class UserVotesController {
  constructor(private readonly votesService: UserVotesService) {}

  @Post()
  vote(@Body() dto: CreateVoteDto) {
    return this.votesService.vote(dto.userId, dto.postId, dto.voteType);
  }

  @Get('status')
  getStatus(@Query('userId') userId: number, @Query('postId') postId: number) {
    return this.votesService.getVoteStatus(userId, postId);
  }
}
```

#### 1.5 API Endpoints
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/votes` | `{ userId, postId, voteType: 'upvote' \| 'downvote' }` | Vote/Toggle vote |
| GET | `/votes/status?userId=1&postId=1` | - | Lấy trạng thái vote |

---

### 2. EMOJI REACTIONS

Sử dụng `UserReact` entity đã có. Cần update service và controller.

#### 2.1 Update DTO
```typescript
// src/user-reacts/dto/create-user-react.dto.ts
import { IsNumber, IsEnum, IsOptional } from 'class-validator';
import { EReactTargetType } from '../enums/react-target-type.enum';

export class CreateUserReactDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  emojiId: number;

  @IsEnum(EReactTargetType)
  type: EReactTargetType;

  @IsOptional()
  @IsNumber()
  postId?: number;

  @IsOptional()
  @IsNumber()
  commentId?: number;
}
```

#### 2.2 Update Service
```typescript
// src/user-reacts/user-reacts.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserReact } from './entities/user-react.entity';
import { EReactTargetType } from './enums/react-target-type.enum';
import { User } from 'src/users/entities/user.entity';
import { Emoji } from 'src/emojis/entities/emoji.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { CreateUserReactDto } from './dto/create-user-react.dto';

@Injectable()
export class UserReactsService {
  constructor(
    @InjectRepository(UserReact)
    private reactRepository: Repository<UserReact>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Emoji)
    private emojiRepository: Repository<Emoji>,
    @InjectRepository(BlogPost)
    private postRepository: Repository<BlogPost>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  /**
   * React to post hoặc comment
   */
  async react(dto: CreateUserReactDto) {
    const user = await this.userRepository.findOneBy({ id: dto.userId });
    if (!user) throw new NotFoundException('User not found');

    const emoji = await this.emojiRepository.findOneBy({ id: dto.emojiId });
    if (!emoji) throw new NotFoundException('Emoji not found');

    if (dto.type === EReactTargetType.POST) {
      if (!dto.postId) throw new BadRequestException('postId is required');
      
      const post = await this.postRepository.findOneBy({ id: dto.postId });
      if (!post) throw new NotFoundException('Post not found');

      // Check existing react
      const existing = await this.reactRepository.findOne({
        where: { user: { id: dto.userId }, post: { id: dto.postId } },
      });

      if (existing) {
        // Nếu react cùng emoji -> xóa (toggle off)
        if (existing.emoji.id === dto.emojiId) {
          await this.reactRepository.remove(existing);
          return { message: 'React removed' };
        }
        // Đổi emoji
        existing.emoji = emoji;
        return this.reactRepository.save(existing);
      }

      // Tạo react mới
      const react = this.reactRepository.create({
        user,
        emoji,
        post,
        type: EReactTargetType.POST,
      });
      return this.reactRepository.save(react);
    }

    if (dto.type === EReactTargetType.COMMENT) {
      if (!dto.commentId) throw new BadRequestException('commentId is required');
      
      const comment = await this.commentRepository.findOneBy({ id: dto.commentId });
      if (!comment) throw new NotFoundException('Comment not found');

      const existing = await this.reactRepository.findOne({
        where: { user: { id: dto.userId }, comment: { id: dto.commentId } },
      });

      if (existing) {
        if (existing.emoji.id === dto.emojiId) {
          await this.reactRepository.remove(existing);
          return { message: 'React removed' };
        }
        existing.emoji = emoji;
        return this.reactRepository.save(existing);
      }

      const react = this.reactRepository.create({
        user,
        emoji,
        comment,
        type: EReactTargetType.COMMENT,
      });
      return this.reactRepository.save(react);
    }
  }

  /**
   * Lấy danh sách reactions của post
   */
  async getPostReactions(postId: number) {
    return this.reactRepository.find({
      where: { post: { id: postId }, type: EReactTargetType.POST },
      relations: ['user', 'emoji'],
    });
  }

  /**
   * Lấy reaction của user cho post cụ thể
   */
  async getUserReactForPost(userId: number, postId: number) {
    return this.reactRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
      relations: ['emoji'],
    });
  }
}
```

#### 2.3 Update Controller
```typescript
// src/user-reacts/user-reacts.controller.ts
import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { UserReactsService } from './user-reacts.service';
import { CreateUserReactDto } from './dto/create-user-react.dto';

@Controller('user-reacts')
export class UserReactsController {
  constructor(private readonly reactsService: UserReactsService) {}

  @Post()
  react(@Body() dto: CreateUserReactDto) {
    return this.reactsService.react(dto);
  }

  @Get('posts/:postId')
  getPostReactions(@Param('postId') postId: number) {
    return this.reactsService.getPostReactions(postId);
  }

  @Get('posts/:postId/user/:userId')
  getUserReact(
    @Param('postId') postId: number,
    @Param('userId') userId: number,
  ) {
    return this.reactsService.getUserReactForPost(userId, postId);
  }
}
```

#### 2.4 API Endpoints
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/user-reacts` | `{ userId, emojiId, type: 'post', postId }` | React/Toggle react |
| GET | `/user-reacts/posts/:postId` | - | Lấy tất cả reactions của post |
| GET | `/user-reacts/posts/:postId/user/:userId` | - | Lấy react của user |

---

### 3. REPORT

#### 3.1 Update DTO
```typescript
// src/reports/dto/create-report.dto.ts
import { IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';
import { EReportType } from '../enums/report-type.enum';

export class CreateReportDto {
  @IsNumber()
  reporterId: number;

  @IsString()
  reason: string;

  @IsEnum(EReportType)
  type: EReportType;

  @IsOptional()
  @IsNumber()
  reportedPostId?: number;

  @IsOptional()
  @IsNumber()
  reportedCommentId?: number;

  @IsOptional()
  @IsNumber()
  reportedUserId?: number;
}
```

#### 3.2 Update Service
```typescript
// src/reports/reports.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { EReportType } from './enums/report-type.enum';
import { User } from 'src/users/entities/user.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BlogPost)
    private postRepository: Repository<BlogPost>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async create(dto: CreateReportDto) {
    const reporter = await this.userRepository.findOneBy({ id: dto.reporterId });
    if (!reporter) throw new NotFoundException('Reporter not found');

    const report = new Report();
    report.reporter = reporter;
    report.reason = dto.reason;
    report.type = dto.type;

    switch (dto.type) {
      case EReportType.POST:
        if (!dto.reportedPostId) throw new BadRequestException('reportedPostId is required');
        const post = await this.postRepository.findOneBy({ id: dto.reportedPostId });
        if (!post) throw new NotFoundException('Post not found');
        report.reportedPost = post;
        break;

      case EReportType.COMMENT:
        if (!dto.reportedCommentId) throw new BadRequestException('reportedCommentId is required');
        const comment = await this.commentRepository.findOneBy({ id: dto.reportedCommentId });
        if (!comment) throw new NotFoundException('Comment not found');
        report.reportedComment = comment;
        break;

      case EReportType.USER:
        if (!dto.reportedUserId) throw new BadRequestException('reportedUserId is required');
        const user = await this.userRepository.findOneBy({ id: dto.reportedUserId });
        if (!user) throw new NotFoundException('User not found');
        report.reportedUser = user;
        break;
    }

    return this.reportRepository.save(report);
  }

  async getReportsByPost(postId: number) {
    return this.reportRepository.find({
      where: { reportedPost: { id: postId } },
      relations: ['reporter'],
    });
  }

  async findAll() {
    return this.reportRepository.find({
      relations: ['reporter', 'reportedPost', 'reportedComment', 'reportedUser'],
    });
  }
}
```

#### 3.3 Update Controller
```typescript
// src/reports/reports.controller.ts
import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Body() dto: CreateReportDto) {
    return this.reportsService.create(dto);
  }

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @Get('posts/:postId')
  getReportsByPost(@Param('postId') postId: number) {
    return this.reportsService.getReportsByPost(postId);
  }
}
```

#### 3.4 API Endpoints
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/reports` | `{ reporterId, reason, type: 'POST', reportedPostId }` | Tạo report |
| GET | `/reports` | - | Lấy tất cả reports |
| GET | `/reports/posts/:postId` | - | Lấy reports của post |

---

### 4. REPOST

Đã có sẵn trong `BlogPostsService.create()` với `type: BlogPostType.REPOST`

#### 4.1 Thêm API kiểm tra đã repost chưa
```typescript
// Thêm vào src/blog-posts/blog-posts.service.ts

/**
 * Kiểm tra user đã repost bài viết chưa
 */
async checkReposted(userId: number, originalPostId: number): Promise<boolean> {
  const repost = await this.repostBlogPostRepository.findOne({
    where: {
      author: { id: userId },
      originalPost: { id: originalPostId },
    },
  });
  return !!repost;
}

/**
 * Xóa repost
 */
async removeRepost(userId: number, originalPostId: number) {
  const repost = await this.repostBlogPostRepository.findOne({
    where: {
      author: { id: userId },
      originalPost: { id: originalPostId },
    },
  });
  
  if (!repost) {
    throw new NotFoundException('Repost not found');
  }
  
  return this.repostBlogPostRepository.remove(repost);
}
```

#### 4.2 Thêm vào Controller
```typescript
// Thêm vào src/blog-posts/blog-posts.controller.ts

@Post('repost')
@ApiOperation({ summary: 'Repost bài viết' })
async repost(@Body() dto: CreateBlogPostDto) {
  dto.type = BlogPostType.REPOST;
  return this.blogPostsService.create(dto);
}

@Get('repost/check')
@ApiOperation({ summary: 'Kiểm tra đã repost chưa' })
async checkReposted(
  @Query('userId') userId: number,
  @Query('originalPostId') originalPostId: number,
) {
  const reposted = await this.blogPostsService.checkReposted(userId, originalPostId);
  return { reposted };
}

@Delete('repost')
@ApiOperation({ summary: 'Xóa repost' })
async removeRepost(
  @Query('userId') userId: number,
  @Query('originalPostId') originalPostId: number,
) {
  return this.blogPostsService.removeRepost(userId, originalPostId);
}
```

#### 4.3 API Endpoints
| Method | Endpoint | Body/Query | Description |
|--------|----------|------------|-------------|
| POST | `/blog-posts/repost` | `{ authorId, originalPostId, title, ... }` | Tạo repost |
| GET | `/blog-posts/repost/check?userId=1&originalPostId=1` | - | Kiểm tra đã repost |
| DELETE | `/blog-posts/repost?userId=1&originalPostId=1` | - | Xóa repost |

---

### 5. SHARE

Share thường là frontend-only (copy link, share lên social media). Tuy nhiên nếu muốn track số lượt share:

#### 5.1 Thêm column vào BlogPost
```typescript
// src/blog-posts/entities/blog-post.entity.ts
@Column({ type: 'int', default: 0 })
shareCount: number;
```

#### 5.2 Thêm API
```typescript
// Thêm vào src/blog-posts/blog-posts.service.ts

/**
 * Tăng share count
 */
async incrementShareCount(postId: number) {
  const post = await this.blogPostRepository.findOneBy({ id: postId });
  if (!post) throw new NotFoundException('Post not found');
  
  post.shareCount += 1;
  return this.blogPostRepository.save(post);
}
```

```typescript
// Thêm vào src/blog-posts/blog-posts.controller.ts

@Post('share')
@ApiOperation({ summary: 'Ghi nhận lượt share' })
async share(@Body('postId') postId: number) {
  return this.blogPostsService.incrementShareCount(postId);
}
```

#### 5.3 API Endpoints
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/blog-posts/share` | `{ postId }` | Ghi nhận lượt share |

---

## 📁 Cấu trúc thư mục cần tạo/update

```
src/
├── user-votes/                    # Module mới cho Upvote/Downvote
│   ├── dto/
│   │   └── create-vote.dto.ts
│   ├── entities/
│   │   └── user-vote.entity.ts
│   ├── user-votes.controller.ts
│   ├── user-votes.service.ts
│   └── user-votes.module.ts
│
├── user-reacts/                   # Update existing
│   ├── dto/
│   │   └── create-user-react.dto.ts  ← Update
│   ├── user-reacts.controller.ts     ← Update
│   └── user-reacts.service.ts        ← Update
│
├── reports/                       # Update existing
│   ├── dto/
│   │   └── create-report.dto.ts      ← Update
│   ├── reports.controller.ts         ← Update
│   └── reports.service.ts            ← Update
│
└── blog-posts/                    # Update existing
    ├── blog-posts.controller.ts      ← Add repost/share endpoints
    ├── blog-posts.service.ts         ← Add repost/share methods
    └── entities/
        └── blog-post.entity.ts       ← Add shareCount column
```

---

## 🚀 Steps để implement

### Step 1: Tạo UserVotes Module
```bash
nest g module user-votes
nest g controller user-votes
nest g service user-votes
```

### Step 2: Migration cho database
```bash
npm run typeorm migration:generate -- -d src/database/data-source.ts -n AddUserVotesAndShareCount
npm run typeorm migration:run
```

### Step 3: Update các module hiện có
- Update `UserReactsModule` imports
- Update `ReportsModule` imports  
- Update `BlogPostsModule` imports

### Step 4: Test APIs
Sử dụng Swagger UI tại `http://localhost:8080/api` hoặc Postman

---

## 📊 Tổng hợp tất cả API Endpoints

| Feature | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| **Vote** | POST | `/votes` | Vote/Toggle |
| **Vote** | GET | `/votes/status` | Lấy trạng thái |
| **React** | POST | `/user-reacts` | React với emoji |
| **React** | GET | `/user-reacts/posts/:postId` | Lấy reactions |
| **React** | GET | `/user-reacts/posts/:postId/user/:userId` | Lấy react của user |
| **Report** | POST | `/reports` | Tạo report |
| **Report** | GET | `/reports/posts/:postId` | Lấy reports của post |
| **Repost** | POST | `/blog-posts/repost` | Tạo repost |
| **Repost** | GET | `/blog-posts/repost/check` | Kiểm tra đã repost |
| **Repost** | DELETE | `/blog-posts/repost` | Xóa repost |
| **Share** | POST | `/blog-posts/share` | Ghi nhận share |

---

## ⚠️ Lưu ý quan trọng

1. **Authentication**: Các API trên cần thêm Guards để verify user đăng nhập
2. **Validation**: Sử dụng `class-validator` cho tất cả DTOs
3. **Error Handling**: Đã có `ResponseExceptionFilter` global
4. **Response Format**: Đã có `ResponseInterceptor` global

---

*Document created: December 4, 2025*
