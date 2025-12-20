import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UserReact } from '../entities/user-react.entity';
import { ToggleReactDto } from '../dto/toggle-react.dto';
import { Emoji } from '../../emojis/entities/emoji.entity';
import { EEmojiType } from '../../emojis/enums/emoji.enum';

/**
 * 🎯 UserReactCommandService - Handle write operations
 *
 * Responsibilities (GRASP - Information Expert):
 * - Toggle reactions (insert/delete)
 * - Tìm/tạo emoji unicode tự động từ codepoint
 * - Validate business rules trước khi thao tác DB
 *
 * Design Principles:
 * - Không query reactions (để QueryService lo)
 * - Để DB unique constraint handle duplicates
 * - Code clean, không if/else phức tạp
 */
@Injectable()
export class UserReactCommandService {
  constructor(
    @InjectRepository(UserReact)
    private readonly userReactRepo: Repository<UserReact>,
    @InjectRepository(Emoji)
    private readonly emojiRepo: Repository<Emoji>,
  ) {}

  /**
   * � Helper: Tìm hoặc tạo emoji
   * - Nếu có emojiId → dùng trực tiếp
   * - Nếu có unicodeCodepoint → tìm/tạo emoji unicode
   */
  private async getOrCreateEmoji(dto: ToggleReactDto): Promise<number> {
    // Case 1: Có emojiId → dùng trực tiếp (custom emoji hoặc emoji đã có)
    if (dto.emojiId) {
      return dto.emojiId;
    }

    // Case 2: Có unicodeCodepoint → tìm/tạo emoji unicode
    if (dto.codepoint) {
      let emoji = await this.emojiRepo.findOne({
        where: {
          type: EEmojiType.UNICODE,
          codepoint: dto.codepoint,
        },
      });

      if (!emoji) {
        // Tạo emoji unicode mới
        emoji = this.emojiRepo.create({
          type: EEmojiType.UNICODE,
          codepoint: dto.codepoint,
          emojiUrl: null,
          community: null,
        });
        emoji = await this.emojiRepo.save(emoji);
      }

      return emoji.id;
    }

    throw new BadRequestException('Either emojiId or unicodeCodepoint is required');
  }

  /**
   * 🔄 Toggle react cho POST
   * - Nếu chưa react: Tạo mới
   * - Nếu đã react: Xóa
   * - DB unique constraint tự handle duplicate
   */
  async toggleReactForPost(dto: ToggleReactDto): Promise<void> {
    if (!dto.postId) {
      throw new BadRequestException('postId is required');
    }

    // Tìm hoặc tạo emoji
    const emojiId = await this.getOrCreateEmoji(dto);

    // Try to find existing reaction
    const existing = await this.userReactRepo.findOne({
      where: {
        user: { id: dto.userId },
        emoji: { id: emojiId },
        post: { id: dto.postId },
      },
    });

    if (existing) {
      // React đã tồn tại → Xóa (toggle off)
      await this.userReactRepo.delete(existing.id);
      return;
    }

    // Chưa react → Tạo mới (toggle on)
    // Dùng insert thay vì save để nhanh hơn, để DB handle unique violation
    try {
      await this.userReactRepo.insert({
        user: { id: dto.userId },
        emoji: { id: emojiId },
        post: { id: dto.postId },
        comment: null,
      });
    } catch (error: unknown) {
      if (error instanceof QueryFailedError && error.name === '23505') {
        // Unique constraint violation → ignore
        return;
      }
      throw error;
    }
  }

  /**
   * 🔄 Toggle react cho COMMENT
   */
  async toggleReactForComment(dto: ToggleReactDto): Promise<void> {
    if (!dto.commentId) {
      throw new BadRequestException('commentId is required');
    }

    // Tìm hoặc tạo emoji
    const emojiId = await this.getOrCreateEmoji(dto);

    const existing = await this.userReactRepo.findOne({
      where: {
        user: { id: dto.userId },
        emoji: { id: emojiId },
        comment: { id: dto.commentId },
      },
    });

    if (existing) {
      await this.userReactRepo.delete(existing.id);
      return;
    }

    try {
      await this.userReactRepo.insert({
        user: { id: dto.userId },
        emoji: { id: emojiId },
        post: null,
        comment: { id: dto.commentId },
      });
    } catch (error: unknown) {
      if (error instanceof QueryFailedError && error.name === '23505') {
        return;
      }
      throw error;
    }
  }
}
