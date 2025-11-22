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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'db.nhmlmwlvvrdabyikxvzo.supabase.co',
      port: 5432,
      username: 'postgres',
      password: 'kadfwfsfsvs',
      database: 'postgres',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: true,
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
