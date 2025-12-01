// src/communities/communities.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { Community } from './entities/community.entity';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
  ) {}

  async create(createCommunityDto: CreateCommunityDto): Promise<Community> {
    const community = this.communityRepository.create({
      ...createCommunityDto,
    });

    return this.communityRepository.save(community);
  }

  async findAll(): Promise<Community[]> {
    // nếu muốn lấy cả members kèm theo:
    // return this.communityRepository.find({ relations: ['members'] });
    return this.communityRepository.find();
  }

  async findOne(id: number): Promise<Community> {
    const community = await this.communityRepository.findOne({
      where: { id },
      // relations: ['members'], // bật nếu cần
    });

    if (!community) {
      throw new NotFoundException(`Community with id ${id} not found`);
    }

    return community;
  }

  async update(
    id: number,
    updateCommunityDto: UpdateCommunityDto,
  ): Promise<Community> {
    // preload sẽ merge { id, ...dto } với entity hiện có
    const community = await this.communityRepository.preload({
      id,
      ...updateCommunityDto,
    });

    if (!community) {
      throw new NotFoundException(`Community with id ${id} not found`);
    }

    return this.communityRepository.save(community);
  }

  async remove(id: number): Promise<void> {
    const community = await this.communityRepository.findOne({ where: { id } });

    if (!community) {
      throw new NotFoundException(`Community with id ${id} not found`);
    }

    await this.communityRepository.remove(community);
  }
}
