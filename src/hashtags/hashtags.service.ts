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

  /**
   * Fetch hashtags for given post ids and return a map keyed by post id string
   */
  async fetchForPosts(postIds: number[]) {
    if (!postIds || postIds.length === 0) return {} as Record<string, { id: number; name: string }[]>;

    const hashtagsQuery = `
      SELECT ph."postId" as post_id, h.id, h.name
      FROM post_hashtags ph
      JOIN hashtags h ON h.id = ph."hashtagId"
      WHERE ph."postId" = ANY($1::bigint[])
      ORDER BY ph."postId", h.name
    `;

    const hashtagsResult: { post_id: number; id: number; name: string }[] =
      await this.hashtagRepository.query(hashtagsQuery, [postIds]);

    return hashtagsResult.reduce((acc, row) => {
      const postId = String(row.post_id);
      if (!acc[postId]) acc[postId] = [];
      acc[postId].push({ id: Number(row.id), name: row.name });
      return acc;
    }, {} as Record<string, { id: number; name: string }[]>);
  }
}
