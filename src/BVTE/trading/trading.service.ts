import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderType, OrderSide, OrderStatus } from '../entities/order.entity';
import { Portfolio } from '../entities/portfolio.entity';
import { Position } from '../entities/position.entity';
import { MarketDataService } from '../market-data/market-data.service';
import { PortfolioService } from '../portfolio/portfolio.service';

export interface CreateOrderDto {
  portfolioId: string;
  symbol: string;
  type: OrderType;
  side: OrderSide;
  quantity: number;
  price?: number;
  stopPrice?: number;
}

@Injectable()
export class TradingService {
  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(Position) private positionRepository: Repository<Position>,
    private readonly marketDataService: MarketDataService,
    private readonly portfolioService: PortfolioService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const portfolio = await this.portfolioService.getPortfolio(createOrderDto.portfolioId, userId);
    
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Validate order
    await this.validateOrder(createOrderDto, portfolio);

    const order = this.orderRepository.create({
      ...createOrderDto,
      user: { id: userId },
      portfolio,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Process order immediately for market orders
    if (createOrderDto.type === OrderType.MARKET) {
      await this.processOrder(savedOrder);
    }

    return savedOrder;
  }

  private async validateOrder(orderDto: CreateOrderDto, portfolio: Portfolio): Promise<void> {
    const marketData = this.marketDataService.getMarketData(orderDto.symbol);
    
    if (!marketData) {
      throw new BadRequestException('Market data not available for symbol');
    }

    if (orderDto.side === OrderSide.BUY) {
      const requiredCash = orderDto.quantity * (orderDto.price || marketData.price);
      if (portfolio.currentBalance < requiredCash) {
        throw new BadRequestException('Insufficient funds');
      }
    } else {
      const position = await this.positionRepository.findOne({
        where: { portfolio: { id: portfolio.id }, symbol: orderDto.symbol }
      });
      
      if (!position || position.quantity < orderDto.quantity) {
        throw new BadRequestException('Insufficient shares to sell');
      }
    }
  }

  async processOrder(order: Order): Promise<void> {
    const marketData = this.marketDataService.getMarketData(order.symbol);
    
    if (!marketData) {
      order.status = OrderStatus.REJECTED;
      await this.orderRepository.save(order);
      return;
    }

    const fillPrice = order.type === OrderType.MARKET ? marketData.price : order.price;
    
    // Execute the order
    order.filledQuantity = order.quantity;
    order.averageFillPrice = fillPrice;
    order.status = OrderStatus.FILLED;

    await this.orderRepository.save(order);
    await this.updatePosition(order, fillPrice);
    await this.updatePortfolioBalance(order, fillPrice);
  }

  private async updatePosition(order: Order, fillPrice: number): Promise<void> {
    let position = await this.positionRepository.findOne({
      where: { portfolio: { id: order.portfolio.id }, symbol: order.symbol }
    });

    if (!position) {
      // Create new position
      position = this.positionRepository.create({
        symbol: order.symbol,
        quantity: order.side === OrderSide.BUY ? order.filledQuantity : -order.filledQuantity,
        averagePrice: fillPrice,
        currentPrice: fillPrice,
        marketValue: order.filledQuantity * fillPrice,
        unrealizedPnL: 0,
        unrealizedReturn: 0,
        portfolio: order.portfolio,
      });
    } else {
      // Update existing position
      if (order.side === OrderSide.BUY) {
        const totalCost = (position.quantity * position.averagePrice) + (order.filledQuantity * fillPrice);
        position.quantity += order.filledQuantity;
        position.averagePrice = totalCost / position.quantity;
      } else {
        position.quantity -= order.filledQuantity;
      }
      
      if (position.quantity <= 0) {
        await this.positionRepository.remove(position);
        return;
      }
      
      position.currentPrice = fillPrice;
      position.marketValue = position.quantity * fillPrice;
      position.unrealizedPnL = (fillPrice - position.averagePrice) * position.quantity;
      position.unrealizedReturn = position.unrealizedPnL / (position.averagePrice * position.quantity);
    }

    await this.positionRepository.save(position);
  }

  private async updatePortfolioBalance(order: Order, fillPrice: number): Promise<void> {
    const totalCost = order.filledQuantity * fillPrice;
    
    if (order.side === OrderSide.BUY) {
      order.portfolio.currentBalance -= totalCost;
    } else {
      order.portfolio.currentBalance += totalCost;
    }

    await this.portfolioService.updatePortfolio(order.portfolio);
  }

  async getOrders(userId: string, portfolioId?: string): Promise<Order[]> {
    const where: any = { user: { id: userId } };
    if (portfolioId) {
      where.portfolio = { id: portfolioId };
    }

    return this.orderRepository.find({
      where,
      relations: ['portfolio'],
      order: { createdAt: 'DESC' }
    });
  }

  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: userId } }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Cannot cancel order that is not pending');
    }

    order.status = OrderStatus.CANCELLED;
    return this.orderRepository.save(order);
  }
}
