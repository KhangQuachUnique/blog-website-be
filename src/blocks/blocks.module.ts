import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BlocksService } from './blocks.service';
import { BlocksController } from './blocks.controller';
import { Block } from './entities/block.entity';
import { ImageBlock } from './entities/image-block.entity';
import { TextBlock } from './entities/text-block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Block, ImageBlock, TextBlock])],
  controllers: [BlocksController],
  providers: [BlocksService],
})
export class BlocksModule {}
