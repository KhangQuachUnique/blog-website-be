import { Emoji } from 'src/emojis/entities/emoji.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CommunityMember } from './community-member.entity';
import { User } from 'src/users/entities/user.entity';

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

  @Column({ type: 'varchar', nullable: true })
  coverImageUrl: string;

  @Column()
  isPublic: boolean;

  @Column({ type: 'boolean', default: false })
  requirePostApproval: boolean;

  @Column({ type: 'boolean', default: false })
  requireMemberApproval: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relations
  @OneToMany(() => CommunityMember, (member) => member.community)
  members: CommunityMember[];

  @OneToMany(() => Emoji, (emoji) => emoji.community, { cascade: true })
  emojis: Emoji[];

  @ManyToMany(() => User, (user) => user.bannedCommunities)
  @JoinTable({
    name: 'community_banned_users',
    joinColumn: { name: 'communityId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  bannedUsers: User[];
}
