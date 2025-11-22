import { Test, TestingModule } from '@nestjs/testing';
import { UserReactsService } from './user-reacts.service';

describe('UserReactsService', () => {
  let service: UserReactsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserReactsService],
    }).compile();

    service = module.get<UserReactsService>(UserReactsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
