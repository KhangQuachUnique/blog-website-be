import { ApiProperty } from '@nestjs/swagger';
import { EEmojiType } from 'src/emojis/enums/emoji.enum';

/**
 * 🎨 Response DTO cho 1 emoji trong emoji bar
 */
export class EmojiSummaryDto {
  @ApiProperty({ example: 5, description: 'ID của emoji' })
  emojiId: number;

  @ApiProperty({ enum: EEmojiType, example: EEmojiType.UNICODE, description: 'Loại emoji' })
  type: EEmojiType;

  @ApiProperty({ example: '1f604', description: 'Unicode codepoint (nếu là unicode emoji)' })
  codepoint?: string;

  @ApiProperty({ example: 'https://cdn.example.com/emoji.png', description: 'URL emoji (nếu là custom)' })
  emojiUrl?: string;

  @ApiProperty({ example: 15, description: 'Tổng số người đã react với emoji này' })
  totalCount: number;

  @ApiProperty({ example: true, description: 'User hiện tại đã react với emoji này chưa' })
  reactedByCurrentUser: boolean;
}

/**
 * 📊 Response DTO cho emoji bar của post/comment
 */
export class UserReactSummaryDto {
  @ApiProperty({ example: 10, description: 'ID của target (postId hoặc commentId)' })
  targetId: number;

  @ApiProperty({ example: 'post', description: 'Loại target' })
  targetType: 'post' | 'comment';

  @ApiProperty({ type: [EmojiSummaryDto], description: 'Danh sách emoji reactions' })
  emojis: EmojiSummaryDto[];

  @ApiProperty({ example: 42, description: 'Tổng số reactions (sum của tất cả emojis)' })
  totalReactions: number;
}
