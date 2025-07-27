import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Signal, SignalStatus } from '../entities/signal.entity';
import { SignalComponent } from '../entities/signal-component.entity';
import { CreateSignalDto } from '../dto/create-signal.dto';
import { UpdateSignalDto } from '../dto/update-signal.dto';
import { SignalQueryDto } from '../dto/signal-query.dto';
import { CreateSignalComponentDto } from '../dto/create-signal-component.dto';

@Injectable()
export class SignalService {
  constructor(
    @InjectRepository(Signal)
    private signalRepository: Repository<Signal>,
    @InjectRepository(SignalComponent)
    private componentRepository: Repository<SignalComponent>,
  ) {}

  async create(createSignalDto: CreateSignalDto, creatorId: string): Promise<Signal> {
    const signal = this.signalRepository.create({
      ...createSignalDto,
      creatorId,
    });

    return this.signalRepository.save(signal);
  }

  async findAll(query: SignalQueryDto): Promise<Signal[]> {
    const queryBuilder = this.signalRepository.createQueryBuilder('signal')
      .leftJoinAndSelect('signal.creator', 'creator')
      .leftJoinAndSelect('signal.components', 'components');

    if (query.search) {
      queryBuilder.where('signal.name ILIKE :search OR signal.description ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('signal.status = :status', { status: query.status });
    }

    if (query.isPublic !== undefined) {
      queryBuilder.andWhere('signal.isPublic = :isPublic', { isPublic: query.isPublic });
    }

    if (query.creatorId) {
      queryBuilder.andWhere('signal.creatorId = :creatorId', { creatorId: query.creatorId });
    }

    return queryBuilder.orderBy('signal.updatedAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Signal> {
    const signal = await this.signalRepository.findOne({
      where: { id },
      relations: ['creator', 'components', 'tests'],
    });

    if (!signal) {
      throw new NotFoundException(`Signal with ID ${id} not found`);
    }

    return signal;
  }

  async update(id: string, updateSignalDto: UpdateSignalDto, userId: string): Promise<Signal> {
    const signal = await this.findOne(id);

    if (signal.creatorId !== userId) {
      throw new BadRequestException('You can only update your own signals');
    }

    Object.assign(signal, updateSignalDto);
    return this.signalRepository.save(signal);
  }

  async remove(id: string, userId: string): Promise<void> {
    const signal = await this.findOne(id);

    if (signal.creatorId !== userId) {
      throw new BadRequestException('You can only delete your own signals');
    }

    await this.signalRepository.remove(signal);
  }

  async addComponent(signalId: string, componentDto: CreateSignalComponentDto, userId: string): Promise<SignalComponent> {
    const signal = await this.findOne(signalId);

    if (signal.creatorId !== userId) {
      throw new BadRequestException('You can only modify your own signals');
    }

    const component = this.componentRepository.create({
      ...componentDto,
      signalId,
    });

    return this.componentRepository.save(component);
  }

  async removeComponent(signalId: string, componentId: string, userId: string): Promise<void> {
    const signal = await this.findOne(signalId);

    if (signal.creatorId !== userId) {
      throw new BadRequestException('You can only modify your own signals');
    }

    const component = await this.componentRepository.findOne({
      where: { id: componentId, signalId },
    });

    if (!component) {
      throw new NotFoundException('Component not found');
    }

    await this.componentRepository.remove(component);
  }

  async validateSignal(signalId: string): Promise<{ isValid: boolean; errors: string[] }> {
    const signal = await this.findOne(signalId);
    const errors: string[] = [];

    // Check if signal has required components
    const hasDataSource = signal.components.some(c => c.type === 'data_source');
    const hasCondition = signal.components.some(c => c.type === 'condition');
    const hasAction = signal.components.some(c => c.type === 'action');

    if (!hasDataSource) errors.push('Signal must have at least one data source');
    if (!hasCondition) errors.push('Signal must have at least one condition');
    if (!hasAction) errors.push('Signal must have at least one action');

    // Validate component connections
    for (const component of signal.components) {
      if (component.connections) {
        for (const connectionId of component.connections) {
          const connectedComponent = signal.components.find(c => c.id === connectionId);
          if (!connectedComponent) {
            errors.push(`Invalid connection: ${connectionId} not found`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async shareSignal(signalId: string, userId: string): Promise<Signal> {
    const signal = await this.findOne(signalId);

    if (signal.creatorId !== userId) {
      throw new BadRequestException('You can only share your own signals');
    }

    signal.shares += 1;
    return this.signalRepository.save(signal);
  }

  async likeSignal(signalId: string): Promise<Signal> {
    const signal = await this.findOne(signalId);
    signal.likes += 1;
    return this.signalRepository.save(signal);
  }
}