import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

// Import Entities để TypeOrmModule.forFeature tạo repository
import { BlogPost } from '../blog-posts/entities/blog-post.entity';
import { User } from '../users/entities/user.entity';
import { Community } from '../communities/entities/community.entity';
import { Hashtag } from '../hashtags/entities/hashtag.entity';

@Module({
  imports: [
    // Đăng ký quyền truy cập vào các bảng này cho SearchModule
    TypeOrmModule.forFeature([BlogPost, User, Community, Hashtag]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
