import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EGender } from '../enums/gender.enum';
import { EUserRole } from '../enums/role.enum';

import { OneToMany, ManyToMany, JoinTable, OneToOne, JoinColumn } from 'typeorm';
import { CommunityMember } from 'src/communities/entities/community-member.entity';
import { SavedPostList } from 'src/saved-post-list/entities/saved-post-list.entity';
import { ViewedHistory } from 'src/viewed-history/entities/viewed-history.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Community } from 'src/communities/entities/community.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  googleId: string | null;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  coverImageUrl: string | null;

  @Column({ type: 'date', nullable: true })
  dob: Date | null;

  @Column({ type: 'enum', enum: EGender, nullable: true })
  gender: EGender | null;

  @Column({ type: 'enum', enum: EUserRole })
  type: EUserRole;

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  @Column({ type: 'boolean', default: false })
  isBanned: boolean;

  @Column({ type: 'boolean', default: false })
  showEmail: boolean; // Kiểm soát hiển thị email công khai

  @Column({ type: 'boolean', default: false })
  showPhoneNumber: boolean; // Kiểm soát hiển thị số điện thoại công khai

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinAt: Date;

  @Column({ type: 'varchar', nullable: true })
  refreshTokenHash: string | null;

  @Column({ type: 'varchar', nullable: true })
  isVerified: string | null; // null = chưa gửi OTP, "123456" = mã OTP đang chờ verify, "verified" = đã xác thực

  @Column({ type: 'varchar', nullable: true })
  resetPasswordOtp: string | null; // null = không có yêu cầu reset, "123456" = mã OTP đang chờ verify

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

  @OneToMany(() => ViewedHistory, (history) => history.user)
  viewedHistory: ViewedHistory[];

  @OneToMany(() => BlogPost, (post) => post.author)
  posts: BlogPost[];

  @ManyToMany(() => Community, (community) => community.bannedUsers)
  bannedCommunities: Community[];
}
