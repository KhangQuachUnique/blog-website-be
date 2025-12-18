import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UserReact } from '../entities/user-react.entity';
import { ToggleReactDto } from '../dto/toggle-react.dto';
import { Emoji } from '../../emojis/entities/emoji.entity';

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
   * Hàm tìm emoji theo codepoint hoặc emojiId
   */
  private async getEmoji(dto: ToggleReactDto): Promise<Emoji> {
    if (!dto.codepoint && !dto.emojiId) {
      throw new BadRequestException('Either emojiId or codepoint is required');
    }

    let emoji: Emoji | null = null;

    if (dto.codepoint) {
      emoji = await this.emojiRepo.findOne({
        where: {
          codepoint: dto.codepoint,
        },
      });
    }

    emoji = await this.emojiRepo.findOne({
      where: {
        id: dto.emojiId,
      },
    });

    if (!emoji) {
      throw new BadRequestException('Either emojiId or unicodeCodepoint is required');
    }
    return emoji;
  }

  /**
   * Hàm toggle reaction cho người dùng
   * @param dto
   * @returns
   */
  async toggleReactForPost(dto: ToggleReactDto): Promise<void> {
    if (!dto.postId) {
      throw new BadRequestException('postId is required');
    }

    // Tìm hoặc tạo emoji
    const emoji = await this.getEmoji(dto);

    // Try to find existing reaction
    const existing = await this.userReactRepo.findOne({
      where: {
        user: { id: dto.userId },
        emoji: { id: emoji.id },
        post: { id: dto.postId },
      },
    });

    if (existing) {
      await this.userReactRepo.delete(existing.id);
      return;
    }

    try {
      await this.userReactRepo.insert({
        user: { id: dto.userId },
        emoji: { id: emoji.id },
        post: { id: dto.postId },
        comment: null,
      });
    } catch (error: unknown) {
      if (error instanceof QueryFailedError && error.name === '23505') {
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
    const emoji = await this.getEmoji(dto);

    const existing = await this.userReactRepo.findOne({
      where: {
        user: { id: dto.userId },
        emoji: { id: emoji.id },
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
        emoji: { id: emoji.id },
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
