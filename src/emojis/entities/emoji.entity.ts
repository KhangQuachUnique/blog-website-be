import { Community } from 'src/communities/entities/community.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EEmojiType } from '../enums/emoji.enum';

@Entity('emojis')
export class Emoji {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: EEmojiType, default: EEmojiType.CUSTOM })
  type: EEmojiType;

  @Column({ type: 'varchar', nullable: true })
  emojiUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  codepoint: string | null;

  @ManyToOne(() => Community, (community) => community.emojis, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  community: Community | null;
}
