// search.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { BlogPost } from '../blog-posts/entities/blog-post.entity';
import { User } from '../users/entities/user.entity';
import { Community } from '../communities/entities/community.entity';
import { Hashtag } from '../hashtags/entities/hashtag.entity';
import { Block } from '../blocks/entities/block.entity'; // <--- Import thêm Block
import { UserReactsModule } from 'src/user-reacts/user-reacts.module';
import { UserVotesModule } from 'src/user-votes/user-votes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogPost, User, Community, Hashtag, Block]),
    UserReactsModule,
    UserVotesModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
