import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Community } from './community.entity';
import { NormalUser } from 'src/users/entities/normal-user.entity';

export enum CommunityRole {
  ADMIN = 'admin',
  MOD = 'mod',
  MEMBER = 'member',
  PENDING = 'pending',
}

@Entity()
export class CommunityMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Community, (community) => community.members)
  community: Community;

  @ManyToOne(() => NormalUser, (user) => user.communityMembers)
  user: NormalUser;

  @Column({
    type: 'varchar',
    default: CommunityRole.PENDING,
  })
  role: CommunityRole;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;
}
