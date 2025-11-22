import { Emoji } from 'src/emojis/entities/emoji.entity';
import { NormalUser } from 'src/users/entities/normal-user.entity';
import { Entity, ManyToOne, PrimaryGeneratedColumn, TableInheritance } from 'typeorm';

@Entity('user_reacts')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class UserReact {
  @PrimaryGeneratedColumn()
  id: number;

  // Relations
  @ManyToOne(() => NormalUser, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  user: NormalUser;

  @ManyToOne(() => Emoji, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  emoji: Emoji;
}
