import { Test, TestingModule } from '@nestjs/testing';
import { NewsVerificationService } from './news-verification.service';

describe('NewsVerificationService', () => {
  let service: NewsVerificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NewsVerificationService],
    }).compile();

    service = module.get<NewsVerificationService>(NewsVerificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
