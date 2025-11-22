import { Module } from '@nestjs/common';
import { UserReactsService } from './user-reacts.service';
import { UserReactsController } from './user-reacts.controller';

@Module({
  controllers: [UserReactsController],
  providers: [UserReactsService],
})
export class UserReactsModule {}
