import { Module } from '@nestjs/common';
import { NewsfeedService } from './newsfeed.service';
import { NewsfeedController } from './newsfeed.controller';

@Module({
  controllers: [NewsfeedController],
  providers: [NewsfeedService],
})
export class NewsfeedModule {}
