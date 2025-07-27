import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TradingPatternEntity } from '../entities/trading-pattern.entity';

@Injectable()
export class TradingPatternRepository {
  constructor(
    @InjectRepository(TradingPatternEntity)
    private readonly repository: Repository<TradingPatternEntity>,
  ) {}

  async create(data: Partial<TradingPatternEntity>): Promise<TradingPatternEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findByToken(tokenSymbol: string): Promise<TradingPatternEntity[]> {
    return this.repository.find({
      where: { tokenSymbol },
      order: {
        confidence: 'DESC',
        detectedDate: 'DESC',
      },
    });
  }

  async findHighConfidencePatterns(
    tokenSymbol: string,
    minConfidence: number = 0.7
  ): Promise<TradingPatternEntity[]> {
    return this.repository
      .createQueryBuilder('pattern')
      .where('pattern.tokenSymbol = :tokenSymbol', { tokenSymbol })
      .andWhere('pattern.confidence >= :minConfidence', { minConfidence })
      .orderBy('pattern.confidence', 'DESC')
      .addOrderBy('pattern.detectedDate', 'DESC')
      .getMany();
  }

  async findByPatternType(
    tokenSymbol: string,
    patternType: string
  ): Promise<TradingPatternEntity[]> {
    return this.repository.find({
      where: {
        tokenSymbol,
        patternType: patternType as any,
      },
      order: {
        detectedDate: 'DESC',
      },
    });
  }
}
