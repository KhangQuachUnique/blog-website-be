import { ChildEntity, ManyToOne } from 'typeorm';

import { NormalUser } from 'src/users/entities/normal-user.entity';
import { Report } from './report.entity';

@ChildEntity('user')
export class UserReport extends Report {
  @ManyToOne(() => NormalUser, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  user: NormalUser;
}
