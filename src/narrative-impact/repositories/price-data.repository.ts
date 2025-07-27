import { Injectable } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PriceDataEntity } from '../entities/price-data.entity';
import { CreatePriceDataDto } from '../dto/create-price-data.dto';

@Injectable()
export class PriceDataRepository {
  constructor(
    @InjectRepository(PriceDataEntity)
    private readonly repository: Repository<PriceDataEntity>,
  ) {}

  async create(createDto: CreatePriceDataDto): Promise<PriceDataEntity> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async findByTokenAndTimeRange(
    tokenSymbol: string,
    startDate: Date,
    endDate: Date,
    interval?: string
  ): Promise<PriceDataEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('price')
      .where('price.tokenSymbol = :tokenSymbol', { tokenSymbol })
      .andWhere('price.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('price.timestamp', 'ASC');

    if (interval) {
      queryBuilder.andWhere('price.interval = :interval', { interval });
    }

    return queryBuilder.getMany();
  }

  async findLatestPrice(tokenSymbol: string): Promise<PriceDataEntity | null> {
    return this.repository
      .createQueryBuilder('price')
      .where('price.tokenSymbol = :tokenSymbol', { tokenSymbol })
      .orderBy('price.timestamp', 'DESC')
      .getOne();
  }

  async bulkCreate(data: CreatePriceDataDto[]): Promise<PriceDataEntity[]> {
    const entities = this.repository.create(data);
    return this.repository.save(entities);
  }

  async deleteOldData(olderThan: Date): Promise<void> {
    await this.repository.delete({
      timestamp: Between(new Date('1970-01-01'), olderThan),
    });
  }
}
