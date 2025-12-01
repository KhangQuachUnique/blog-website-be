import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Community } from './community.entity';
import { ECommunityRole } from '../enums/community-role.enum';
import { User } from 'src/users/entities/user.entity';
import { ECommunityMemberStatus } from '../enums/community-member-status.enum';

@Entity('community_members')
export class CommunityMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Community, (community) => community.members, {
    onDelete: 'CASCADE',
  })
  community: Community;

  @ManyToOne(() => User, (user) => user.communitiesMemberOf, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @Column({
    type: 'enum',
    enum: ECommunityRole,
    default: ECommunityRole.MEMBER,
  })
  role: ECommunityRole;

  @Column({
    type: 'enum',
    enum: ECommunityMemberStatus,
    default: ECommunityMemberStatus.ACTIVE,
  })
  status: ECommunityMemberStatus;
}
