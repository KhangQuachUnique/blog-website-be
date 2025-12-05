import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EGender } from '../enums/gender.enum';
import { EUserRole } from '../enums/role.enum';

import { OneToMany, ManyToMany, JoinTable, OneToOne, JoinColumn } from 'typeorm';
import { CommunityMember } from 'src/communities/entities/community-member.entity';
import { SavedPostList } from 'src/saved-post-list/entities/saved-post-list.entity';
import { ViewedHistory } from 'src/viewed-history/entities/viewed-history.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';

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

  @OneToMany(() => ViewedHistory, (history) => history.user)
  viewedHistory: ViewedHistory[];

  @OneToMany(() => BlogPost, (post) => post.author)
  posts: BlogPost[];
}
