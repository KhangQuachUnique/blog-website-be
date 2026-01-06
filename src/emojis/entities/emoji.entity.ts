import { Community } from 'src/communities/entities/community.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EEmojiType } from '../enums/emoji.enum';

@Entity('emojis')
export class Emoji {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: EEmojiType, default: EEmojiType.CUSTOM })
  type: EEmojiType;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  // URL for custom emojis, unicode emojis do not have this
  @Column({ type: 'varchar', nullable: true })
  emojiUrl: string | null;

  // Unicode codepoint for standard emojis, custom emojis do not have this
  @Column({ type: 'varchar', nullable: true })
  codepoint: string | null;

  // Relations
  // Unicode emojis do not belong to any community
  @ManyToOne(() => Community, (community) => community.emojis, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  community: Community | null;
}
