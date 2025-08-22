import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignalParametersEntity } from '../entities/trading-signal.entity';
import { CreateSignalParametersDto } from '../dto/signal-parameters.dto';
import { SignalParameters } from '../interfaces/trading-signal.interface';

@Injectable()
export class SignalParametersService {
  constructor(
    @InjectRepository(SignalParametersEntity)
    private readonly parametersRepository: Repository<SignalParametersEntity>,
  ) {}

  async createParameters(dto: CreateSignalParametersDto): Promise<SignalParameters> {
    const entity = new SignalParametersEntity();
    entity.name = dto.name;
    entity.description = dto.description;
    entity.weights = dto.weights;
    entity.thresholds = dto.thresholds;
    entity.filters = dto.filters;
    entity.timeframe = dto.timeframe;

    const saved = await this.parametersRepository.save(entity);
    return this.entityToParameters(saved);
  }

  async getAllParameters(): Promise<SignalParameters[]> {
    const entities = await this.parametersRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    return entities.map(entity => this.entityToParameters(entity));
  }

  async getParametersById(id: string): Promise<SignalParameters | null> {
    const entity = await this.parametersRepository.findOne({
      where: { id, isActive: true },
    });

    return entity ? this.entityToParameters(entity) : null;
  }

  private entityToParameters(entity: SignalParametersEntity): SignalParameters {
    return {
      name: entity.name,
      description: entity.description,
      weights: entity.weights,
      thresholds: entity.thresholds,
      filters: entity.filters,
      timeframe: entity.timeframe as any,
    };
  }
}