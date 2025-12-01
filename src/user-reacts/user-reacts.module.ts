import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserReact } from './entities/user-react.entity';
import { UserReactsService } from './user-reacts.service';
import { UserReactsController } from './user-reacts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserReact])],
  controllers: [UserReactsController],
  providers: [UserReactsService],
})
export class UserReactsModule {}
