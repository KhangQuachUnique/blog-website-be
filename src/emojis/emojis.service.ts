import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Emoji } from './entities/emoji.entity';
import { CreateEmojiDto } from './dto/create-emoji.dto';
import { UpdateEmojiDto } from './dto/update-emoji.dto';

@Injectable()
export class EmojisService {
  constructor(
    @InjectRepository(Emoji)
    private emojiRepository: Repository<Emoji>,
  ) {}

  create(createEmojiDto: CreateEmojiDto) {
    return 'This action adds a new emoji';
  }

  findAll() {
    return `This action returns all emojis`;
  }

  findOne(id: number) {
    return `This action returns a #${id} emoji`;
  }

  update(id: number, updateEmojiDto: UpdateEmojiDto) {
    return `This action updates a #${id} emoji`;
  }

  remove(id: number) {
    return `This action removes a #${id} emoji`;
  }
}
