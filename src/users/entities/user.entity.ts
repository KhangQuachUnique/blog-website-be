import { Column, Entity, PrimaryGeneratedColumn, TableInheritance } from 'typeorm';
import { EGender } from '../enums/gender.enum';

@Entity('users')
@TableInheritance({ column: { type: 'varchar', name: 'role' } })
export abstract class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ type: 'date', nullable: true })
  dob: Date | null;

  @Column({ type: 'enum', enum: EGender, default: EGender.OTHER })
  gender: EGender;

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinAt: Date;
}
