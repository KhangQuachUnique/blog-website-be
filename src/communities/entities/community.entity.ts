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

  @Column({ type: 'boolean', default: false })
  requirePostApproval: boolean;      

  @Column({ type: 'boolean', default: false })
  requireMemberApproval: boolean;  

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => CommunityMember, (member) => member.community)
  members: CommunityMember[];

  @OneToMany(() => Emoji, (emoji) => emoji.community, { cascade: true })
  emojis: Emoji[];
}