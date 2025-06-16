import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import axios from 'axios';

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  timestamp: Date;
}

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private marketData = new Map<string, MarketData>();
  
  constructor(private readonly wsGateway: WebSocketGateway) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async fetchMarketData() {
    try {
      // Simulate real-time market data (replace with actual API calls)
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA'];
      
      for (const symbol of symbols) {
        const lastPrice = this.marketData.get(symbol)?.price || 100;
        const change = (Math.random() - 0.5) * 5; // Random price movement
        const newPrice = Math.max(lastPrice + change, 0.01);
        
        const marketData: MarketData = {
          symbol,
          price: Number(newPrice.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(((change / lastPrice) * 100).toFixed(4)),
          volume: Math.floor(Math.random() * 1000000),
          high: Number((newPrice * 1.02).toFixed(2)),
          low: Number((newPrice * 0.98).toFixed(2)),
          timestamp: new Date(),
        };

        this.marketData.set(symbol, marketData);
        
        // Broadcast to connected clients
        this.wsGateway.broadcastMarketData(marketData);
      }
    } catch (error) {
      this.logger.error('Error fetching market data:', error);
    }
  }

  getMarketData(symbol: string): MarketData | undefined {
    return this.marketData.get(symbol);
  }

  getAllMarketData(): MarketData[] {
    return Array.from(this.marketData.values());
  }

  // In production, implement actual API integration
  async fetchRealTimeData(symbol: string): Promise<MarketData> {
    // Example integration with Alpha Vantage, Yahoo Finance, or IEX Cloud
    // const response = await axios.get(`https://api.example.com/quote/${symbol}`);
    // return this.transformApiData(response.data);
    
    return this.getMarketData(symbol) || this.generateMockData(symbol);
  }

  private generateMockData(symbol: string): MarketData {
    const basePrice = 100 + Math.random() * 400;
    return {
      symbol,
      price: Number(basePrice.toFixed(2)),
      change: Number(((Math.random() - 0.5) * 10).toFixed(2)),
      changePercent: Number(((Math.random() - 0.5) * 5).toFixed(4)),
      volume: Math.floor(Math.random() * 1000000),
      high: Number((basePrice * 1.05).toFixed(2)),
      low: Number((basePrice * 0.95).toFixed(2)),
      timestamp: new Date(),
    };
  }
}