import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { Block } from './entities/block.entity';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
  ) {}

  create(createBlockDto: CreateBlockDto) {
    return 'This action adds a new block';
  }

  findAll() {
    return `This action returns all blocks`;
  }

  findOne(id: number) {
    return `This action returns a #${id} block`;
  }

  update(id: number, updateBlockDto: UpdateBlockDto) {
    return `This action updates a #${id} block`;
  }

  remove(id: number) {
    return `This action removes a #${id} block`;
  }
}
