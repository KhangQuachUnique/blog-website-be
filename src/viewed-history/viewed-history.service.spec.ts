import { Test, TestingModule } from '@nestjs/testing';
import { ViewedHistoryService } from './viewed-history.service';

describe('ViewedHistoryService', () => {
  let service: ViewedHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ViewedHistoryService],
    }).compile();

    service = module.get<ViewedHistoryService>(ViewedHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
