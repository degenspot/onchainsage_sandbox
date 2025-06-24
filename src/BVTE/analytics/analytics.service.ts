import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BacktestResult } from '../entities/backtest-result.entity';
import { Strategy } from '../entities/strategy.entity';
import { Order } from '../entities/order.entity';
import { MarketDataService } from '../market-data/market-data.service';

export interface BacktestParams {
  strategyId: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  symbols: string[];
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(BacktestResult) private backtestRepository: Repository<BacktestResult>,
    @InjectRepository(Strategy) private strategyRepository: Repository<Strategy>,
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    private readonly marketDataService: MarketDataService,
  ) {}

  async runBacktest(userId: string, params: BacktestParams): Promise<BacktestResult> {
    const strategy = await this.strategyRepository.findOne({
      where: { id: params.strategyId, user: { id: userId } }
    });

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    // Simulate backtest execution
    const results = await this.executeBacktest(strategy, params);
    
    const backtestResult = this.backtestRepository.create({
      strategy,
      startDate: params.startDate,
      endDate: params.endDate,
      initialCapital: params.initialCapital,
      finalValue: results.finalValue,
      totalReturn: results.totalReturn,
      annualizedReturn: results.annualizedReturn,
      volatility: results.volatility,
      sharpeRatio: results.sharpeRatio,
      maxDrawdown: results.maxDrawdown,
      totalTrades: results.totalTrades,
      winRate: results.winRate,
      tradeHistory: results.tradeHistory,
      performanceMetrics: results.performanceMetrics,
    });

    return this.backtestRepository.save(backtestResult);
  }

  private async executeBacktest(strategy: Strategy, params: BacktestParams): Promise<any> {
    // Simplified backtest simulation
    const trades = [];
    let currentValue = params.initialCapital;
    let maxValue = currentValue;
    let maxDrawdown = 0;
    let wins = 0;
    
    // Generate random trades for simulation
    const numberOfTrades = Math.floor(Math.random() * 100) + 50;
    
    for (let i = 0; i < numberOfTrades; i++) {
      const isWin = Math.random() > 0.4; // 60% win rate
      const returnPercent = isWin ? 
        (Math.random() * 0.1 + 0.02) : // 2-12% gain
        -(Math.random() * 0.08 + 0.01); // 1-9% loss
      
      const tradeValue = currentValue * 0.1; // Risk 10% per trade
      const pnl = tradeValue * returnPercent;
      currentValue += pnl;
      
      if (isWin) wins++;
      if (currentValue > maxValue) maxValue = currentValue;
      
      const drawdown = (maxValue - currentValue) / maxValue;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      
      trades.push({
        date: new Date(params.startDate.getTime() + (i * 24 * 60 * 60 * 1000)),
        symbol: params.symbols[Math.floor(Math.random() * params.symbols.length)],
        side: Math.random() > 0.5 ? 'BUY' : 'SELL',
        quantity: Math.floor(Math.random() * 100) + 10,
        price: 100 + Math.random() * 200,
        pnl,
        returnPercent,
      });
    }

    const totalReturn = (currentValue - params.initialCapital) / params.initialCapital;
    const daysDiff = (params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const annualizedReturn = Math.pow(1 + totalReturn, 365 / daysDiff) - 1;
    
    return {
      finalValue: currentValue,
      totalReturn,
      annualizedReturn,
      volatility: 0.15 + Math.random() * 0.1, // Simulated volatility
      sharpeRatio: annualizedReturn / (0.15 + Math.random() * 0.1),
      maxDrawdown,
      totalTrades: numberOfTrades,
      winRate: wins / numberOfTrades,
      tradeHistory: trades,
      performanceMetrics: {
        calmarRatio: annualizedReturn / maxDrawdown,
        profitFactor: 1.2 + Math.random() * 0.8,
        averageWin: trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / wins,
        averageLoss: trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / (numberOfTrades - wins),
      }
    };
  }

  async getBacktestResults(userId: string, strategyId?: string): Promise<BacktestResult[]> {
    const where: any = { strategy: { user: { id: userId } } };
    if (strategyId) {
      where.strategy.id = strategyId;
    }

    return this.backtestRepository.find({
      where,
      relations: ['strategy'],
      order: { createdAt: 'DESC' }
    });
  }

  async getPortfolioAnalytics(portfolioId: string, userId: string): Promise<any> {
    const orders = await this.orderRepository.find({
      where: { portfolio: { id: portfolioId }, user: { id: userId } },
      order: { createdAt: 'ASC' }
    });

    // Calculate various performance metrics
    const metrics = this.calculatePerformanceMetrics(orders);
    
    return {
      totalTrades: orders.length,
      ...metrics,
      tradingFrequency: this.calculateTradingFrequency(orders),
      riskMetrics: this.calculateRiskMetrics(orders),
    };
  }

    private calculatePerformanceMetrics(orders: Order[]): Partial<PerformanceMetrics> {
        // Simplified metrics calculation
        const filledOrders = orders.filter(o => o.status === 'FILLED');
        const wins = filledOrders.filter(o => o.side === 'BUY' && o.averageFillPrice > 0).length;
        const losses = filledOrders.filter(o => o.side === 'SELL' && o.averageFillPrice < 0).length;
        const totalPnL = filledOrders.reduce((sum, o) => sum + (o.averageFillPrice * o.filledQuantity), 0);
        const totalTrades = filledOrders.length;
        const winRate = totalTrades > 0 ? wins / totalTrades : 0;
    }