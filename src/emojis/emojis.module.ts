import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Emoji } from './entities/emoji.entity';
import { EmojisService } from './emojis.service';
import { EmojisController } from './emojis.controller';
import { Community } from 'src/communities/entities/community.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Emoji, Community])],
  controllers: [EmojisController],
  providers: [EmojisService],
  exports: [EmojisService],
})
export class EmojisModule {}
