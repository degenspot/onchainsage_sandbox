import { Injectable } from '@nestjs/common';
import { Repository, DataSource, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NarrativeDataEntity } from '../entities/narrative-data.entity';
import { CreateNarrativeDataDto } from '../dto/create-narrative-data.dto';

@Injectable()
export class NarrativeDataRepository {
  constructor(
    @InjectRepository(NarrativeDataEntity)
    private readonly repository: Repository<NarrativeDataEntity>,
  ) {}

  async create(createDto: CreateNarrativeDataDto): Promise<NarrativeDataEntity> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async findByTokenAndTimeRange(
    tokenSymbol: string,
    startDate: Date,
    endDate: Date,
    identifiers?: string[]
  ): Promise<NarrativeDataEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('narrative')
      .where('narrative.tokenSymbol = :tokenSymbol', { tokenSymbol })
      .andWhere('narrative.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('narrative.timestamp', 'ASC');

    if (identifiers && identifiers.length > 0) {
      queryBuilder.andWhere('narrative.identifier IN (:...identifiers)', { identifiers });
    }

    return queryBuilder.getMany();
  }

  async findTopIdentifiersByVolume(
    tokenSymbol: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<Array<{ identifier: string; totalVolume: number; avgSentiment: number }>> {
    return this.repository
      .createQueryBuilder('narrative')
      .select('narrative.identifier', 'identifier')
      .addSelect('SUM(narrative.volume)', 'totalVolume')
      .addSelect('AVG(narrative.sentiment)', 'avgSentiment')
      .where('narrative.tokenSymbol = :tokenSymbol', { tokenSymbol })
      .andWhere('narrative.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('narrative.identifier')
      .orderBy('totalVolume', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async bulkCreate(data: CreateNarrativeDataDto[]): Promise<NarrativeDataEntity[]> {
    const entities = this.repository.create(data);
    return this.repository.save(entities);
  }

  async deleteOldData(olderThan: Date): Promise<void> {
    await this.repository.delete({
      timestamp: Between(new Date('1970-01-01'), olderThan),
    });
  }
}