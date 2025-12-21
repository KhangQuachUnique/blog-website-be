import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserReactsModule } from 'src/user-reacts/user-reacts.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UserReactsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
