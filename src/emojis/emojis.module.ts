import { Module } from '@nestjs/common';
import { EmojisService } from './emojis.service';
import { EmojisController } from './emojis.controller';

@Module({
  controllers: [EmojisController],
  providers: [EmojisService],
})
export class EmojisModule {}
