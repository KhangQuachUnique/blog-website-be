import { Test, TestingModule } from '@nestjs/testing';
import { EmojisController } from './emojis.controller';
import { EmojisService } from './emojis.service';

describe('EmojisController', () => {
  let controller: EmojisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmojisController],
      providers: [EmojisService],
    }).compile();

    controller = module.get<EmojisController>(EmojisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
