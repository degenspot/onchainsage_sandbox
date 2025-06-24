import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../entities/portfolio.entity';
import { Position } from '../entities/position.entity';
import { MarketDataService } from '../market-data/market-data.service';

export interface CreatePortfolioDto {
  name: string;
  initialBalance: number;
}

export interface PortfolioSummary {
  portfolio: Portfolio;
  positions: Position[];
  totalValue: number;
  totalPnL: number;
  totalReturn: number;
  dayChange: number;
  dayChangePercent: number;
}

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio) private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Position) private positionRepository: Repository<Position>,
    private readonly marketDataService: MarketDataService,
  ) {}

  async createPortfolio(userId: string, createDto: CreatePortfolioDto): Promise<Portfolio> {
    const portfolio = this.portfolioRepository.create({
      ...createDto,
      currentBalance: createDto.initialBalance,
      user: { id: userId },
    });

    return this.portfolioRepository.save(portfolio);
  }

  async getPortfolios(userId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.find({
      where: { user: { id: userId } },
      relations: ['positions'],
      order: { createdAt: 'DESC' }
    });
  }

  async getPortfolio(portfolioId: string, userId: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId, user: { id: userId } },
      relations: ['positions', 'orders']
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    return portfolio;
  }

  async getPortfolioSummary(portfolioId: string, userId: string): Promise<PortfolioSummary> {
    const portfolio = await this.getPortfolio(portfolioId, userId);
    const positions = await this.positionRepository.find({
      where: { portfolio: { id: portfolioId } }
    });

    // Update positions with current market data
    let totalMarketValue = 0;
    let totalUnrealizedPnL = 0;

    for (const position of positions) {
      const marketData = this.marketDataService.getMarketData(position.symbol);
      if (marketData) {
        position.currentPrice = marketData.price;
        position.marketValue = position.quantity * marketData.price;
        position.unrealizedPnL = (marketData.price - position.averagePrice) * position.quantity;
        position.unrealizedReturn = position.unrealizedPnL / (position.averagePrice * position.quantity);
        
        totalMarketValue += position.marketValue;
        totalUnrealizedPnL += position.unrealizedPnL;
        
        await this.positionRepository.save(position);
      }
    }

    const totalValue = portfolio.currentBalance + totalMarketValue;
    const totalPnL = totalValue - portfolio.initialBalance;
    const totalReturn = totalPnL / portfolio.initialBalance;

    return {
      portfolio,
      positions,
      totalValue,
      totalPnL,
      totalReturn,
      dayChange: 0, // Calculate based on previous day's value
      dayChangePercent: 0,
    };
  }

  async updatePortfolio(portfolio: Portfolio): Promise<Portfolio> {
    return this.portfolioRepository.save(portfolio);
  }

  async deletePortfolio(portfolioId: string, userId: string): Promise<void> {
    const portfolio = await this.getPortfolio(portfolioId, userId);
    await this.portfolioRepository.remove(portfolio);
  }
}