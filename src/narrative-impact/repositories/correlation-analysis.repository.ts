import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CorrelationAnalysisEntity } from '../entities/correlation-analysis.entity';

@Injectable()
export class CorrelationAnalysisRepository {
  constructor(
    @InjectRepository(CorrelationAnalysisEntity)
    private readonly repository: Repository<CorrelationAnalysisEntity>,
  ) {}

  async create(data: Partial<CorrelationAnalysisEntity>): Promise<CorrelationAnalysisEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findByTokenAndDate(
    tokenSymbol: string,
    analysisDate: Date
  ): Promise<CorrelationAnalysisEntity[]> {
    return this.repository.find({
      where: {
        tokenSymbol,
        analysisDate,
      },
      order: {
        pearsonCorrelation: 'DESC',
      },
    });
  }

  async findStrongCorrelations(
    tokenSymbol: string,
    minStrength: 'moderate' | 'strong' | 'very_strong' = 'moderate'
  ): Promise<CorrelationAnalysisEntity[]> {
    const strengthOrder = ['very_weak', 'weak', 'moderate', 'strong', 'very_strong'];
    const minIndex = strengthOrder.indexOf(minStrength);
    const validStrengths = strengthOrder.slice(minIndex);

    return this.repository
      .createQueryBuilder('correlation')
      .where('correlation.tokenSymbol = :tokenSymbol', { tokenSymbol })
      .andWhere('correlation.strength IN (:...strengths)', { strengths: validStrengths })
      .orderBy('correlation.analysisDate', 'DESC')
      .addOrderBy('ABS(correlation.pearsonCorrelation)', 'DESC')
      .getMany();
  }
}
