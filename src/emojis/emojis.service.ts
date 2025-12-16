import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Emoji } from './entities/emoji.entity';
import { CreateEmojiDto } from './dto/create-emoji.dto';
import { UpdateEmojiDto } from './dto/update-emoji.dto';
import { Community } from 'src/communities/entities/community.entity';

@Injectable()
export class EmojisService {
  constructor(
    @InjectRepository(Emoji)
    private emojiRepository: Repository<Emoji>,

    @InjectRepository(Community)
    private communityRepository: Repository<Community>,
  ) {}

  /**
   * Tạo emoji mới cho community
   * @param createEmojiDto
   * @returns Emoji đã được tạo
   */
  async create(createEmojiDto: CreateEmojiDto): Promise<Emoji> {
    const community = await this.communityRepository.findOne({
      where: { id: createEmojiDto.communityId },
    });

    if (!community) {
      throw new NotFoundException(
        `Không tìm thấy community với ID: ${createEmojiDto.communityId}`,
      );
    }

    const emoji = this.emojiRepository.create({
      emojiUrl: createEmojiDto.emojiUrl,
      community,
    });

    return this.emojiRepository.save(emoji);
  }

  /**
   * Lấy tất cả emojis
   * @returns Danh sách tất cả emojis
   */
  async findAll(): Promise<Emoji[]> {
    return this.emojiRepository.find({
      relations: ['community'],
    });
  }

  /**
   * Lấy emoji theo ID
   * @param id ID của emoji
   * @returns Emoji tìm được
   */
  async findOne(id: number): Promise<Emoji> {
    const emoji = await this.emojiRepository.findOne({
      where: { id },
      relations: ['community'],
    });

    if (!emoji) {
      throw new NotFoundException(`Không tìm thấy emoji với ID: ${id}`);
    }

    return emoji;
  }

  /**
   * Lấy emojis theo community ID
   * @param communityId ID của community
   * @returns Danh sách emojis của community
   */
  async findByCommunity(communityId: number): Promise<Emoji[]> {
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException(`Không tìm thấy community với ID: ${communityId}`);
    }

    return this.emojiRepository.find({
      where: { community: { id: communityId } },
      relations: ['community'],
    });
  }

  /**
   * Cập nhật emoji
   * @param id ID của emoji
   * @param updateEmojiDto Dữ liệu cập nhật
   * @returns Emoji đã được cập nhật
   */
  async update(id: number, updateEmojiDto: UpdateEmojiDto): Promise<Emoji> {
    const emoji = await this.findOne(id);

    if (updateEmojiDto.emojiUrl) {
      emoji.emojiUrl = updateEmojiDto.emojiUrl;
    }

    if (updateEmojiDto.communityId) {
      const community = await this.communityRepository.findOne({
        where: { id: updateEmojiDto.communityId },
      });

      if (!community) {
        throw new NotFoundException(
          `Không tìm thấy community với ID: ${updateEmojiDto.communityId}`,
        );
      }

      emoji.community = community;
    }

    return this.emojiRepository.save(emoji);
  }

  /**
   * Xóa emoji
   * @param id ID của emoji
   * @returns Kết quả xóa
   */
  async remove(id: number): Promise<void> {
    const emoji = await this.findOne(id);
    await this.emojiRepository.remove(emoji);
  }

  /**
   * Lấy tất cả emojis từ các community user đã tham gia
   * @param userId ID của user
   * @returns Danh sách emojis từ các community user đã join
   */
  async findByUserCommunities(userId: number): Promise<Emoji[]> {
    const emojis = await this.emojiRepository
      .createQueryBuilder('emoji')
      .leftJoinAndSelect('emoji.community', 'community')
      .leftJoin('community.members', 'member')
      .where('member.userId = :userId', { userId })
      .andWhere('emoji.type = :type', { type: 'CUSTOM' })
      .orderBy('community.name', 'ASC')
      .addOrderBy('emoji.id', 'ASC')
      .getMany();

    return emojis;
  }
}
