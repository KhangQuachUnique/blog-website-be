import { Test, TestingModule } from '@nestjs/testing';
import { NewsfeedController } from './newsfeed.controller';
import { NewsfeedService } from './newsfeed.service';

describe('NewsfeedController', () => {
  let controller: NewsfeedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsfeedController],
      providers: [NewsfeedService],
    }).compile();

    controller = module.get<NewsfeedController>(NewsfeedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
