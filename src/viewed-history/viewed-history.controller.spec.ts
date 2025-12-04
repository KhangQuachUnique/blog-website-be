import { Test, TestingModule } from '@nestjs/testing';
import { ViewedHistoryController } from './viewed-history.controller';
import { ViewedHistoryService } from './viewed-history.service';

describe('ViewedHistoryController', () => {
  let controller: ViewedHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ViewedHistoryController],
      providers: [ViewedHistoryService],
    }).compile();

    controller = module.get<ViewedHistoryController>(ViewedHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
