# All Entities (Aggregated)

This file contains the full source of every `*.entity.ts` file in the project as a single reference. It is a documentation/reference file only (TypeScript is fenced inside code blocks), so it will not be compiled by TypeScript.

--

## src/users/entities/user.entity.ts

```typescript
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EGender } from '../enums/gender.enum';
import { EUserRole } from '../enums/role.enum';

import { OneToMany, ManyToMany, JoinTable, OneToOne, JoinColumn } from 'typeorm';
import { CommunityMember } from 'src/communities/entities/community-member.entity';
import { SavedPostList } from 'src/saved-post-list/entities/saved-post-list.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ type: 'date', nullable: true })
  dob: Date | null;

  @Column({ type: 'enum', enum: EGender, nullable: true })
  gender: EGender;

  @Column({ type: 'enum', enum: EUserRole })
  type: EUserRole;

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinAt: Date;

  //Relations
  @OneToMany(() => CommunityMember, (member) => member.user)
  communitiesMemberOf: CommunityMember[];

  @OneToOne(() => SavedPostList, (list) => list.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  savedPostList: SavedPostList;

  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable({
    name: 'user_follows',
    joinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'followingId',
      referencedColumnName: 'id',
    },
  })
  following: User[];

  @ManyToMany(() => User, (user) => user.following)
  followers: User[];

  @ManyToMany(() => User, (user) => user.blockedBy)
  @JoinTable({
    name: 'user_blocks',
    joinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'blockedUserId',
      referencedColumnName: 'id',
    },
  })
  blockedUsers: User[];

  @ManyToMany(() => User, (user) => user.blockedUsers)
  blockedBy: User[];
}
```

--

## src/communities/entities/community.entity.ts

```typescript
import { Emoji } from 'src/emojis/entities/emoji.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CommunityMember } from './community-member.entity';

@Entity()
export class Community {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  thumbnailUrl: string;

  @Column()
  isPublic: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relations
  @OneToMany(() => CommunityMember, (member) => member.community)
  members: CommunityMember[];

  @OneToMany(() => Emoji, (emoji) => emoji.community, { cascade: true })
  emojis: Emoji[];
}
```

--

## src/communities/entities/community-member.entity.ts

```typescript
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Community } from './community.entity';
import { ECommunityRole } from '../enums/community-role.enum';
import { User } from 'src/users/entities/user.entity';

@Entity('community_members')
export class CommunityMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Community, (community) => community.members)
  community: Community;

  @ManyToOne(() => User, (user) => user.communitiesMemberOf)
  user: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @Column({ type: 'enum', enum: ECommunityRole, default: ECommunityRole.MEMBER })
  role: ECommunityRole;
}
```

--

## src/hashtags/entities/hashtag.entity.ts

```typescript
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('hashtags')
export class Hashtag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  name: string;

  // Relations
  @ManyToMany(() => BlogPost, (post) => post.hashtags)
  posts: BlogPost[];
}
```

--

## src/notifications/entities/notification-template.entity.ts

```typescript
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  message: string;
}
```

--

## src/saved-post-list/entities/saved-post-list-item.entity.ts

```typescript
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SavedPostList } from './saved-post-list.entity';

@Entity('saved_post_list_items')
export class SavedPostListItem {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  savedAt: Date;

  // Relations
  @ManyToOne(() => BlogPost, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  post: BlogPost;

  @ManyToOne(() => SavedPostList, (savedPostList) => savedPostList.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  savedPostList: SavedPostList;
}
```

--

## src/notifications/entities/notification.entity.ts

```typescript
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NotificationTemplate } from './notification-template.entity';

@Entity('notifications')
@Index(['isRead'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  isRead: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  sender: User;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  receiver: User;

  @ManyToOne(() => NotificationTemplate, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  template: NotificationTemplate;
}
```

--

## src/saved-post-list/entities/saved-post-list.entity.ts

```typescript
import { Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SavedPostListItem } from './saved-post-list-item.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('saved_post_lists')
export class SavedPostList {
  @PrimaryGeneratedColumn()
  id: number;

  // Relations
  @OneToOne(() => User, (user) => user.savedPostList, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  user: User;

  @OneToMany(() => SavedPostListItem, (item) => item.savedPostList, {
    onDelete: 'CASCADE',
  })
  items: SavedPostListItem[];
}
```

--

## src/reports/entities/report.entity.ts

```typescript
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EReportType } from '../enums/report-type.enum';
import { User } from 'src/users/entities/user.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'enum', enum: EReportType })
  type: EReportType;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  reporter: User;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  reportedUser: User;

  @ManyToOne(() => Comment, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  reportedComment: Comment;

  @ManyToOne(() => BlogPost, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  reportedPost: BlogPost;
}
```

--

## src/user-reacts/entities/user-react.entity.ts

```typescript
import { Emoji } from 'src/emojis/entities/emoji.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EReactTargetType } from '../enums/react-target-type.enum';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Comment } from 'src/comments/entities/comment.entity';

@Entity('user_reacts')
export class UserReact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: EReactTargetType })
  type: EReactTargetType;

  // Relations
  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  user: User;

  @ManyToOne(() => Emoji, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  emoji: Emoji;

  @ManyToOne(() => BlogPost, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  post: BlogPost;

  @ManyToOne(() => Comment, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  comment: Comment;
}
```

--

## src/emojis/entities/emoji.entity.ts

```typescript
import { Community } from 'src/communities/entities/community.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('emojis')
export class Emoji {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  emojiUrl: string;

  @ManyToOne(() => Community, (community) => community.emojis, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  community: Community;
}
```

--

## src/comments/entities/comment.entity.ts

```typescript
import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChildComment } from './child-comment.entity';
import { ECommentType } from '../enums/comment-type.enum';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Block } from 'src/blocks/entities/block.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('comments')
@Index(['createAt'])
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column({ type: 'enum', enum: ECommentType })
  type: ECommentType;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createAt: Date;

  // Relations
  @OneToMany(() => ChildComment, (childComment) => childComment.parentComment, { cascade: true })
  childComments: ChildComment[];

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  commenter: User;

  @ManyToOne(() => BlogPost, {
    onDelete: 'CASCADE',
  })
  post: BlogPost;

  @ManyToOne(() => Block, {
    onDelete: 'CASCADE',
  })
  block: Block;
}
```

--

## src/comments/entities/child-comment.entity.ts

```typescript
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Comment } from './comment.entity';

@Entity('child_comments')
export class ChildComment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Comment, (comment) => comment.childComments)
  parentComment: Comment;

  @ManyToOne(() => User)
  commentUser: User;

  @ManyToOne(() => User)
  replyToUser: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createAt: Date;
}
```

--

## src/blog-posts/entities/personal-blog-post.entity.ts

```typescript
import { ChildEntity } from 'typeorm';

import { BlogPost } from './blog-post.entity';
import { BlogPostType } from '../enums/blog-post-type.enum';

@ChildEntity(BlogPostType.PERSONAL)
export class PersonalBlogPost extends BlogPost {}
```

--

## src/blog-posts/entities/repost-blog-post.entity.ts

```typescript
import { ChildEntity, Column } from 'typeorm';

import { BlogPost } from './blog-post.entity';
import { BlogPostType } from '../enums/blog-post-type.enum';

@ChildEntity(BlogPostType.REPOST)
export class RepostBlogPost extends BlogPost {
  @Column({ type: 'bigint' })
  originalPostId: number;
}
```

--

## src/blog-posts/entities/community-blog-post.entity.ts

```typescript
import { ChildEntity, Column, ManyToOne } from 'typeorm';

import { BlogPost } from './blog-post.entity';
import { Community } from 'src/communities/entities/community.entity';
import { BlogPostType } from '../enums/blog-post-type.enum';

@ChildEntity(BlogPostType.COMMUNITY)
export class CommunityBlogPost extends BlogPost {
  @ManyToOne(() => Community, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  community: Community;

  @Column({ default: false })
  isApproved: boolean;
}
```

--

## src/blog-posts/entities/blog-post.entity.ts

```typescript
import { Block } from 'src/blocks/entities/block.entity';
import { Hashtag } from 'src/hashtags/entities/hashtag.entity';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';
import { EBlogPostStatus } from '../enums/blog-post-status.enum';
import { Comment } from 'src/comments/entities/comment.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('blog_posts')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
@Index(['createdAt'])
@Index(['isPublic'])
export abstract class BlogPost {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  thumbnailUrl: string;

  @Column({ type: 'int', default: 0 })
  upVotes: number;

  @Column({ type: 'int', default: 0 })
  downVotes: number;

  @Column({ type: 'boolean', default: true })
  isPublic: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'enum', enum: EBlogPostStatus, default: EBlogPostStatus.ACTIVE })
  status: EBlogPostStatus;

  // Relations
  @OneToMany(() => Comment, (comment) => comment.post, { cascade: true })
  comments: Comment[];

  @ManyToMany(() => Hashtag, (hashtag) => hashtag.posts)
  @JoinTable({
    name: 'post_hashtags',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'hashtagId', referencedColumnName: 'id' },
  })
  hashtags: Hashtag[];

  @OneToMany(() => Block, (block) => block.post, { cascade: true })
  blocks: Block[];

  @ManyToOne('User', {
    onDelete: 'SET NULL',
    nullable: true,
  })
  author: User;
}
```

--

## src/blocks/entities/block.entity.ts

```typescript
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { EBlockType } from '../enums/block-type.enum';

@Entity('blocks')
export class Block {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  x: number;

  @Column()
  y: number;

  @Column()
  width: number;

  @Column()
  height: number;

  @Column({ type: 'enum', enum: EBlockType })
  type: EBlockType;

  @Column({ type: 'text' })
  content: string;

  // Relations
  @ManyToOne(() => BlogPost, (post) => post.blocks, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  post: BlogPost;

  @OneToMany(() => Comment, (comment) => comment.block, { cascade: true })
  comments: Comment[];
}
#src\viewed-history\entities\viewed-history.entity.ts
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';

@Entity('viewed_history')
export class ViewedHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.viewedHistory)
  user: User;

  @ManyToOne(() => BlogPost, (post) => post.viewedBy)
  post: BlogPost;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

```

--

If you want this aggregated content moved into a single `.ts` file (so it compiles), say so explicitly — I'll advise about duplicate declarations and how to namespace or rename classes to avoid conflicts. For now, this markdown file is safe (non-compiling) and contains the exact entity sources.
