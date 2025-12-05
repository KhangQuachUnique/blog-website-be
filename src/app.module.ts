import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { BlogPostsModule } from './blog-posts/blog-posts.module';
import { BlocksModule } from './blocks/blocks.module';
import { CommentsModule } from './comments/comments.module';
import { HashtagsModule } from './hashtags/hashtags.module';
import { UserReactsModule } from './user-reacts/user-reacts.module';
import { EmojisModule } from './emojis/emojis.module';
import { CommunitiesModule } from './communities/communities.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SavedPostListModule } from './saved-post-list/saved-post-list.module';
import { ViewedHistoryModule } from './viewed-history/viewed-history.module';
import { NewsfeedModule } from './newsfeed/newsfeed.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: 'postgresql://postgres.nhmlmwlvvrdabyikxvzo:kadfwfsfsvs@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
      database: 'postgres',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    BlogPostsModule,
    BlocksModule,
    CommentsModule,
    HashtagsModule,
    UserReactsModule,
    EmojisModule,
    CommunitiesModule,
    ReportsModule,
    NotificationsModule,
    SavedPostListModule,
    ViewedHistoryModule,
    NewsfeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
