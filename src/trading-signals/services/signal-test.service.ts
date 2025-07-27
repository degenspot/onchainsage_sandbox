import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignalTest, TestStatus } from '../entities/signal-test.entity';
import { TestSignalDto } from '../dto/test-signal.dto';
import { SignalService } from './signal.service';

@Injectable()
export class SignalTestService {
  constructor(
    @InjectRepository(SignalTest)
    private testRepository: Repository<SignalTest>,
    private signalService: SignalService,
  ) {}

  async createTest(signalId: string, testDto: TestSignalDto, userId: string): Promise<SignalTest> {
    const signal = await this.signalService.findOne(signalId);

    if (signal.creatorId !== userId) {
      throw new BadRequestException('You can only test your own signals');
    }

    const test = this.testRepository.create({
      ...testDto,
      signalId,
      parameters: {
        ...testDto.parameters,
        startDate: testDto.startDate,
        endDate: testDto.endDate,
      },
    });

    const savedTest = await this.testRepository.save(test);

    // Start the test asynchronously
    this.runTest(savedTest.id);

    return savedTest;
  }

  async findTestsBySignal(signalId: string): Promise<SignalTest[]> {
    return this.testRepository.find({
      where: { signalId },
      order: { createdAt: 'DESC' },
    });
  }

  async findTest(testId: string): Promise<SignalTest> {
    const test = await this.testRepository.findOne({
      where: { id: testId },
      relations: ['signal'],
    });

    if (!test) {
      throw new NotFoundException(`Test with ID ${testId} not found`);
    }

    return test;
  }

  private async runTest(testId: string): Promise<void> {
    try {
      const test = await this.findTest(testId);
      
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock test results
      const results = {
        totalTrades: Math.floor(Math.random() * 100) + 1,
        winRate: Math.random() * 0.4 + 0.4, // 40-80%
        totalReturn: (Math.random() - 0.5) * 0.4, // -20% to +20%
        maxDrawdown: Math.random() * 0.15, // 0-15%
        sharpeRatio: Math.random() * 2 + 0.5, // 0.5-2.5
      };

      test.results = results;
      test.status = TestStatus.COMPLETED;
      
      await this.testRepository.save(test);
    } catch (error) {
      await this.testRepository.update(testId, {
        status: TestStatus.FAILED,
        errorMessage: error.message,
      });
    }
  }
}