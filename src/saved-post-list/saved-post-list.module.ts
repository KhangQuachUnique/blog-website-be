import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedPostListService } from './saved-post-list.service';
import { SavedPostListController } from './saved-post-list.controller';
import { SavedPostList } from './entities/saved-post-list.entity';
import { SavedPostListItem } from './entities/saved-post-list-item.entity';
import { User } from '../users/entities/user.entity';
import { BlogPost } from '../blog-posts/entities/blog-post.entity';
import { UserReactsModule } from 'src/user-reacts/user-reacts.module';
import { UserVotesModule } from 'src/user-votes/user-votes.module';

/**
 * 🔖 SavedPostListModule
 *
 * Dependencies:
 * - SavedPostList entity: User's saved list
 * - SavedPostListItem entity: Individual saved posts
 * - User entity: Để validate user
 * - BlogPost entity: Để validate post
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([SavedPostList, SavedPostListItem, User, BlogPost]),
    UserReactsModule,
    UserVotesModule,
  ],
  controllers: [SavedPostListController],
  providers: [SavedPostListService],
  exports: [SavedPostListService], // Export để các module khác có thể dùng
})
export class SavedPostListModule {}
