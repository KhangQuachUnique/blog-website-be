import { Injectable } from '@nestjs/common';
import { CreateViewedHistoryDto } from './dto/create-viewed-history.dto';
import { UpdateViewedHistoryDto } from './dto/update-viewed-history.dto';

@Injectable()
export class ViewedHistoryService {
  create(createViewedHistoryDto: CreateViewedHistoryDto) {
    return 'This action adds a new viewedHistory';
  }

  findAll() {
    return `This action returns all viewedHistory`;
  }

  findOne(id: number) {
    return `This action returns a #${id} viewedHistory`;
  }

  update(id: number, updateViewedHistoryDto: UpdateViewedHistoryDto) {
    return `This action updates a #${id} viewedHistory`;
  }

  remove(id: number) {
    return `This action removes a #${id} viewedHistory`;
  }
}
