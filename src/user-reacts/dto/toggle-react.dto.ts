import { IsNumber, IsOptional, ValidateIf, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 🎯 DTO để toggle reaction
 *
 * Validation Rules:
 * - userId bắt buộc
 * - emojiId HOẶC unicodeCodepoint (mutually exclusive)
 * - postId HOẶC commentId (mutually exclusive)
 * - Không cần truyền action (toggle tự động bởi DB unique)
 *
 * Use cases:
 * 1. React với custom emoji → Gửi emojiId
 * 2. React với unicode emoji → Gửi unicodeCodepoint (BE tự tìm/tạo)
 */
export class ToggleReactDto {
  @ApiProperty({ example: 1, description: 'ID của user thực hiện react' })
  @IsNumber()
  userId: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'ID của emoji (dùng cho custom emoji hoặc emoji đã có sẵn)',
  })
  @IsOptional()
  @IsNumber()
  emojiId?: number;

  @ApiPropertyOptional({
    example: '1f604',
    description:
      'Unicode codepoint (dùng cho unicode emoji, VD: "1f604" = 😄). BE tự tìm/tạo emoji',
  })
  @IsOptional()
  @IsString()
  codepoint?: string;

  @ApiPropertyOptional({ example: 10, description: 'ID của post (chỉ dùng nếu react vào post)' })
  @ValidateIf((o: ToggleReactDto) => !o.commentId)
  @IsNumber()
  postId?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'ID của comment (chỉ dùng nếu react vào comment)',
  })
  @ValidateIf((o: ToggleReactDto) => !o.postId)
  @IsNumber()
  commentId?: number;
}
