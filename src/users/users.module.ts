import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { NormalUser } from './entities/normal-user.entity';
import { AdminUser } from './entities/admin-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, NormalUser, AdminUser])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
