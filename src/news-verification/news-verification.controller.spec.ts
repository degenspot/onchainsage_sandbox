import { Test, TestingModule } from '@nestjs/testing';
import { NewsVerificationController } from './news-verification.controller';
import { NewsVerificationService } from './news-verification.service';

describe('NewsVerificationController', () => {
  let controller: NewsVerificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsVerificationController],
      providers: [NewsVerificationService],
    }).compile();

    controller = module.get<NewsVerificationController>(NewsVerificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
