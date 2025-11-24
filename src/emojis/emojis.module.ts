import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Emoji } from './entities/emoji.entity';
import { EmojisService } from './emojis.service';
import { EmojisController } from './emojis.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Emoji])],
  controllers: [EmojisController],
  providers: [EmojisService],
})
export class EmojisModule {}
