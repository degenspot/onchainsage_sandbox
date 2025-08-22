import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BacktestResultEntity } from '../entities/trading-signal.entity';
import { SignalGeneratorService } from './signal-generator.service';
import { OnChainDataService } from './on-chain-data.service';
import { BacktestResult, BacktestTrade, TradingSignal } from '../interfaces/trading-signal.interface';

@Injectable()
export class BacktestService {
  private readonly logger = new Logger(BacktestService.name);

  constructor(
    @InjectRepository(BacktestResultEntity)
    private readonly backtestRepository: Repository<BacktestResultEntity>,
    private readonly signalGenerator: SignalGeneratorService,
    private readonly onChainData: OnChainDataService,
  ) {}

  async runBacktest(
    parameterSetId: string,
    startDate: Date,
    endDate: Date,
    tokenAddresses: string[] = ['0xA0b86a33E6C4C30c0cbDBce5E4f4E5F9B8E6E5E0'] // Default test token
  ): Promise<BacktestResult> {
    this.logger.log(`Starting backtest for parameters ${parameterSetId} from ${startDate} to ${endDate}`);

    const trades: BacktestTrade[] = [];
    let totalReturn = 0;
    let maxDrawdown = 0;
    let winningTrades = 0;
    const holdingTimes: number[] = [];

    for (const tokenAddress of tokenAddresses) {
      try {
        const tokenTrades = await this.backtestToken(
          tokenAddress,
          parameterSetId,
          startDate,
          endDate
        );
        trades.push(...tokenTrades);
      } catch (error) {
        this.logger.error(`Backtest failed for token ${tokenAddress}:`, error);
      }
    }

    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(trades);

    const result: BacktestResult = {
      id: '', // Will be set after saving
      parameterSetId,
      startDate,
      endDate,
      totalTrades: trades.length,
      winRate: performance.winRate,
      totalReturn: performance.totalReturn,
      maxDrawdown: performance.maxDrawdown,
      sharpeRatio: performance.sharpeRatio,
      avgHoldingTime: performance.avgHoldingTime,
      trades,
      createdAt: new Date(),
    };

    return await this.saveBacktestResult(result);
  }

  async getBacktestResults(parameterSetId?: string): Promise<BacktestResult[]> {
    const query = this.backtestRepository.createQueryBuilder('backtest');
    
    if (parameterSetId) {
      query.where('backtest.parameterSetId = :parameterSetId', { parameterSetId });
    }

    const entities = await query
      .orderBy('backtest.createdAt', 'DESC')
      .getMany();

    return entities.map(entity => this.entityToBacktestResult(entity));
  }

  private async backtestToken(
    tokenAddress: string,
    parameterSetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BacktestTrade[]> {
    const trades: BacktestTrade[] = [];
    let currentPosition: { signal: TradingSignal; entryPrice: number } | null = null;

    // Simulate trading at regular intervals (e.g., every hour)
    const intervalMs = 60 * 60 * 1000; // 1 hour
    let currentTime = new Date(startDate);

    while (currentTime <= endDate) {
      try {
        // Generate signal for this timestamp
        const signal = await this.generateHistoricalSignal(
          tokenAddress,
          currentTime,
          parameterSetId
        );

        if (!signal) {
          currentTime = new Date(currentTime.getTime() + intervalMs);
          continue;
        }

        // Trading logic
        if (!currentPosition && (signal.signal === 'BUY' || signal.signal === 'STRONG_BUY')) {
          // Enter position
          currentPosition = {
            signal,
            entryPrice: signal.price,
          };
        } else if (currentPosition && (signal.signal === 'SELL' || signal.signal === 'STRONG_SELL')) {
          // Exit position
          const trade = this.createBacktestTrade(currentPosition, signal);
          trades.push(trade);
          currentPosition = null;
        }

        currentTime = new Date(currentTime.getTime() + intervalMs);
      } catch (error) {
        this.logger.error(`Error in backtest simulation at ${currentTime}:`, error);
        currentTime = new Date(currentTime.getTime() + intervalMs);
      }
    }

    // Close any remaining position at the end
    if (currentPosition) {
      const finalSignal = await this.generateHistoricalSignal(tokenAddress, endDate, parameterSetId);
      if (finalSignal) {
        const trade = this.createBacktestTrade(currentPosition, finalSignal);
        trades.push(trade);
      }
    }

    return trades;
  }

  private async generateHistoricalSignal(
    tokenAddress: string,
    timestamp: Date,
    parameterSetId: string
  ): Promise<TradingSignal | null> {
    try {
      // In a real implementation, this would use historical data
      // For simulation, we'll generate mock signals with some randomness
      const tokenSymbol = `TOKEN_${tokenAddress.slice(-6)}`;
      
      // Add some time-based logic to simulate market conditions
      const hour = timestamp.getHours();
      const isMarketHours = hour >= 9 && hour <= 16; // Simulate market hours
      
      if (!isMarketHours && Math.random() > 0.3) {
        return null; // Less activity outside market hours
      }

      return await this.signalGenerator.generateSignal(tokenAddress, tokenSymbol, parameterSetId);
    } catch (error) {
      return null;
    }
  }

  private createBacktestTrade(
    position: { signal: TradingSignal; entryPrice: number },
    exitSignal: TradingSignal
  ): BacktestTrade {
    const entryTime = position.signal.timestamp;
    const exitTime = exitSignal.timestamp;
    const holdingTimeHours = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
    
    const pnl = ((exitSignal.price - position.entryPrice) / position.entryPrice) * 100;

    return {
      tokenAddress: position.signal.tokenAddress,
      entrySignal: position.signal,
      exitSignal,
      entryPrice: position.entryPrice,
      exitPrice: exitSignal.price,
      entryTime,
      exitTime,
      pnl,
      status: 'CLOSED',
    };
  }

  private calculatePerformanceMetrics(trades: BacktestTrade[]): any {
    if (trades.length === 0) {
      return {
        winRate: 0,
        totalReturn: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        avgHoldingTime: 0,
      };
    }

    const winningTrades = trades.filter(trade => trade.pnl > 0).length;
    const winRate = (winningTrades / trades.length) * 100;

    const totalReturn = trades.reduce((sum, trade) => sum + trade.pnl, 0);

    // Calculate max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningReturn = 0;

    trades.forEach(trade => {
      runningReturn += trade.pnl;
      if (runningReturn > peak) peak = runningReturn;
      const drawdown = peak - runningReturn;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Calculate Sharpe ratio (simplified)
    const returns = trades.map(trade => trade.pnl);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const returnVariance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const returnStdDev = Math.sqrt(returnVariance);
    const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

    // Calculate average holding time
    const holdingTimes = trades.map(trade => 
      (trade.exitTime!.getTime() - trade.entryTime.getTime()) / (1000 * 60 * 60) // Hours
    );
    const avgHoldingTime = holdingTimes.reduce((sum, time) => sum + time, 0) / holdingTimes.length;

    return {
      winRate,
      totalReturn,
      maxDrawdown,
      sharpeRatio,
      avgHoldingTime,
    };
  }

  private async saveBacktestResult(result: BacktestResult): Promise<BacktestResult> {
    const entity = new BacktestResultEntity();
    entity.parameterSetId = result.parameterSetId;
    entity.startDate = result.startDate;
    entity.endDate = result.endDate;
    entity.totalTrades = result.totalTrades;
    entity.winRate = result.winRate;
    entity.totalReturn = result.totalReturn;
    entity.maxDrawdown = result.maxDrawdown;
    entity.sharpeRatio = result.sharpeRatio;
    entity.avgHoldingTime = result.avgHoldingTime;
    entity.trades = result.trades;

    const saved = await this.backtestRepository.save(entity);
    return { ...result, id: saved.id };
  }

  private entityToBacktestResult(entity: BacktestResultEntity): BacktestResult {
    return {
      id: entity.id,
      parameterSetId: entity.parameterSetId,
      startDate: entity.startDate,
      endDate: entity.endDate,
      totalTrades: entity.totalTrades,
      winRate: Number(entity.winRate),
      totalReturn: Number(entity.totalReturn),
      maxDrawdown: Number(entity.maxDrawdown),
      sharpeRatio: Number(entity.sharpeRatio),
      avgHoldingTime: Number(entity.avgHoldingTime),
      trades: entity.trades,
      createdAt: entity.createdAt,
    };
  }
}