import { Test, TestingModule } from '@nestjs/testing';
import { UserReactsController } from './user-reacts.controller';
import { UserReactsService } from './user-reacts.service';

describe('UserReactsController', () => {
  let controller: UserReactsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserReactsController],
      providers: [UserReactsService],
    }).compile();

    controller = module.get<UserReactsController>(UserReactsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
