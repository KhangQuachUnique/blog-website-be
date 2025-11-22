import { Module } from '@nestjs/common';
import { SavedPostListService } from './saved-post-list.service';
import { SavedPostListController } from './saved-post-list.controller';

@Module({
  controllers: [SavedPostListController],
  providers: [SavedPostListService],
})
export class SavedPostListModule {}
