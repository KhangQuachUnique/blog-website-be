import { Module } from '@nestjs/common';
import { SavedPostListService } from './saved-post-list.service';
import { SavedPostListController } from './saved-post-list.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedPostList } from './entities/saved-post-list.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SavedPostList])],
  controllers: [SavedPostListController],
  providers: [SavedPostListService],
})
export class SavedPostListModule {}
