import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Emoji } from '../emojis/entities/emoji.entity';
import { UserReact } from './entities/user-react.entity';
import { UserReactCommandService } from './services/user-react-command.service';
import { UserReactQueryService } from './services/user-react-query.service';
import { UserReactsController } from './user-reacts.controller';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { Comment } from '@modules/comments/entities/comment.entity';

/**
 * UserReactsModule - Clean Architecture
 *
 * Structure:
 * ├── entities/          # Domain models
 * ├── dto/               # Data transfer objects
 * ├── services/
 * │   ├── command.service.ts  # Write operations
 * │   └── query.service.ts    # Read operations
 * └── controller.ts      # HTTP endpoints
 *
 * Exports:
 * - UserReactQueryService: Để các module khác query reactions
 * - KHÔNG export CommandService (chỉ dùng internal qua Controller)
 *
 * Design rationale:
 * - CQRS: Tách command/query rõ ràng
 * - Low Coupling: Các module khác chỉ phụ thuộc vào QueryService
 * - Information Expert: user-react module biết về reactions
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserReact, Emoji, BlogPost, Comment]), NotificationsModule],
  controllers: [UserReactsController],
  providers: [UserReactCommandService, UserReactQueryService],
  exports: [UserReactQueryService],
})
export class UserReactsModule {}
