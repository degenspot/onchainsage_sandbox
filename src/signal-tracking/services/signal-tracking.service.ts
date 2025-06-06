import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Signal } from '../entities/signal.entity';
import { SignalPerformance } from '../entities/signal-performance.entity';
import { CreateSignalDto } from '../dto/create-signal.dto';
import { SignalStatus } from '../../../shared/enums/signal.enums';

@Injectable()
export class SignalTrackingService {
  constructor(
    @InjectRepository(Signal)
    private signalRepository: Repository<Signal>,
    @InjectRepository(SignalPerformance)
    private performanceRepository: Repository<SignalPerformance>,
  ) {}

  async createSignal(createSignalDto: CreateSignalDto): Promise<Signal> {
    const signal = this.signalRepository.create({
      ...createSignalDto,
      status: SignalStatus.ACTIVE,
    });

    return await this.signalRepository.save(signal);
  }

  async updateSignalExit(signalId: string, exitPrice: number): Promise<Signal> {
    const signal = await this.findSignalById(signalId);
    
    signal.exitPrice = exitPrice;
    signal.status = SignalStatus.CLOSED;
    signal.closedAt = new Date();

    await this.signalRepository.save(signal);
    await this.calculatePerformance(signal);
    
    return signal;
  }

  async findSignalById(id: string): Promise<Signal> {
    const signal = await this.signalRepository.findOne({
      where: { id },
      relations: ['performances'],
    });

    if (!signal) {
      throw new NotFoundException(`Signal with ID ${id} not found`);
    }

    return signal;
  }

  async getSignalsByDateRange(startDate: Date, endDate: Date): Promise<Signal[]> {
    return await this.signalRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ['performances'],
      order: { createdAt: 'DESC' },
    });
  }

  private async calculatePerformance(signal: Signal): Promise<void> {
    if (!signal.exitPrice || !signal.entryPrice) return;

    const pnlPercentage = signal.type === 'BUY' 
      ? ((signal.exitPrice - signal.entryPrice) / signal.entryPrice) * 100
      : ((signal.entryPrice - signal.exitPrice) / signal.entryPrice) * 100;

    const durationMinutes = signal.closedAt && signal.executedAt
      ? Math.floor((signal.closedAt.getTime() - signal.executedAt.getTime()) / (1000 * 60))
      : 0;

    const performance = this.performanceRepository.create({
      signalId: signal.id,
      realizedPnl: signal.exitPrice - signal.entryPrice,
      realizedPnlPercentage: pnlPercentage,
      unrealizedPnl: 0,
      unrealizedPnlPercentage: 0,
      durationMinutes,
      accuracyScore: this.calculateAccuracyScore(signal, pnlPercentage),
      maxDrawdown: 0, // Would be calculated with tick data
      maxRunup: 0,    // Would be calculated with tick data
      isWinning: pnlPercentage > 0,
    });

    await this.performanceRepository.save(performance);
  }

  private calculateAccuracyScore(signal: Signal, pnlPercentage: number): number {
    // Weighted accuracy based on confidence and actual performance
    const baseAccuracy = pnlPercentage > 0 ? 100 : 0;
    const confidenceWeight = signal.confidenceScore / 100;
    
    return Math.min(100, baseAccuracy * confidenceWeight);
  }
}