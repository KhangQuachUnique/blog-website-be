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
