import { Test, TestingModule } from '@nestjs/testing';
import { SavedPostListService } from './saved-post-list.service';

describe('SavedPostListService', () => {
  let service: SavedPostListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SavedPostListService],
    }).compile();

    service = module.get<SavedPostListService>(SavedPostListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
