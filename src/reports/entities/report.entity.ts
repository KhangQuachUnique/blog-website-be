import { NormalUser } from 'src/users/entities/normal-user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, TableInheritance } from 'typeorm';

@Entity('reports')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => NormalUser, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  reporter: NormalUser;
}
