import { ChildEntity } from 'typeorm';
import { User } from './user.entity';

@ChildEntity('admin')
export class AdminUser extends User {}
