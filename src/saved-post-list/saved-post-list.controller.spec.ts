import { Test, TestingModule } from '@nestjs/testing';
import { SavedPostListController } from './saved-post-list.controller';
import { SavedPostListService } from './saved-post-list.service';

describe('SavedPostListController', () => {
  let controller: SavedPostListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavedPostListController],
      providers: [SavedPostListService],
    }).compile();

    controller = module.get<SavedPostListController>(SavedPostListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
