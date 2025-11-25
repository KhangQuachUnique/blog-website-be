import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Community } from './community.entity';
import { NormalUser } from 'src/users/entities/normal-user.entity';
import { ECommunityRole } from '../enums/community-role.enum';

@Entity('community_members')
export class CommunityMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Community, (community) => community.members)
  community: Community;

  @ManyToOne(() => NormalUser, (user) => user.communitiesMemberOf)
  user: NormalUser;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @Column({ type: 'enum', enum: ECommunityRole, default: ECommunityRole.MEMBER })
  role: ECommunityRole;
}
