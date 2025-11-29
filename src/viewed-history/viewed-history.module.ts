import { Module } from '@nestjs/common';
import { ViewedHistoryService } from './viewed-history.service';
import { ViewedHistoryController } from './viewed-history.controller';

@Module({
  controllers: [ViewedHistoryController],
  providers: [ViewedHistoryService],
})
export class ViewedHistoryModule {}
