import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { CreateHashtagDto } from './dto/create-hashtag.dto';
import { UpdateHashtagDto } from './dto/update-hashtag.dto';
import { Hashtag } from './entities/hashtag.entity';

@Injectable()
export class HashtagsService {
  constructor(
    @InjectRepository(Hashtag)
    private hashtagRepository: Repository<Hashtag>,
  ) {}

  create(createHashtagDto: CreateHashtagDto) {
    return 'This action adds a new hashtag';
  }

  findAll() {
    return `This action returns all hashtags`;
  }

  findOne(id: number) {
    return `This action returns a #${id} hashtag`;
  }

  update(id: number, updateHashtagDto: UpdateHashtagDto) {
    return `This action updates a #${id} hashtag`;
  }

  remove(id: number) {
    return `This action removes a #${id} hashtag`;
  }

  /**
   * Get or create hashtags by names
   * @param names
   * @returns
   */
  async getOrCreate(names: string[]): Promise<Hashtag[]> {
    if (!names || names.length === 0) {
      return Promise.resolve([]);
    }

    const existing = await this.hashtagRepository.find({
      where: { name: In(names) },
    });
    const existingNames = existing.map((hashtag) => hashtag.name);

    const newNames = names.filter((name) => !existingNames.includes(name));
    const newHashtags = this.hashtagRepository.create(newNames.map((name) => ({ name })));

    const savedNewHashtags = await this.hashtagRepository.save(newHashtags);
    return [...existing, ...savedNewHashtags];
  }
}
