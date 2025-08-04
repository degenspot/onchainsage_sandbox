import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DataIntegrationService {
  private readonly logger = new Logger(DataIntegrationService.name);

  constructor(private httpService: HttpService) {}

  // Price Data Integration
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      // Example: Integrate with CoinGecko API
      const response = await firstValueFrom(
        this.httpService.get(`https://api.coingecko.com/api/v3/simple/price`, {
          params: {
            ids: symbol.toLowerCase(),
            vs_currencies: 'usd',
          },
        })
      );

      return response.data[symbol.toLowerCase()]?.usd || 0;
    } catch (error) {
      this.logger.error(`Failed to get price for ${symbol}:`, error);
      return 0;
    }
  }

  async getHistoricalPrice(symbol: string, days: number): Promise<number[]> {
    try {
      // Example: Get historical price data
      const response = await firstValueFrom(
        this.httpService.get(`https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days,
          },
        })
      );

      return response.data.prices.map((price: [number, number]) => price[1]);
    } catch (error) {
      this.logger.error(`Failed to get historical price for ${symbol}:`, error);
      return [];
    }
  }

  // Volume Data Integration
  async getCurrentVolume(symbol: string): Promise<number> {
    try {
      // Example: Get current volume from exchange API
      const response = await firstValueFrom(
        this.httpService.get(`https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days: 1,
          },
        })
      );

      const volumes = response.data.total_volumes;
      return volumes[volumes.length - 1]?.[1] || 0;
    } catch (error) {
      this.logger.error(`Failed to get volume for ${symbol}:`, error);
      return 0;
    }
  }

  async getAverageVolume(symbol: string, hours: number): Promise<number> {
    try {
      const volumes = await this.getHistoricalVolume(symbol, hours);
      if (volumes.length === 0) return 0;

      const sum = volumes.reduce((acc, vol) => acc + vol, 0);
      return sum / volumes.length;
    } catch (error) {
      this.logger.error(`Failed to get average volume for ${symbol}:`, error);
      return 0;
    }
  }

  private async getHistoricalVolume(symbol: string, hours: number): Promise<number[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days: Math.ceil(hours / 24),
          },
        })
      );

      return response.data.total_volumes.map((volume: [number, number]) => volume[1]);
    } catch (error) {
      this.logger.error(`Failed to get historical volume for ${symbol}:`, error);
      return [];
    }
  }

  // Narrative Data Integration
  async getNarrativeData(narrativeName: string): Promise<any> {
    try {
      // Example: Integrate with social sentiment analysis
      // This would typically connect to your existing narrative service
      const response = await firstValueFrom(
        this.httpService.get(`/api/narratives/${encodeURIComponent(narrativeName)}/sentiment`)
      );

      return {
        trendingScore: response.data.trendingScore || 0,
        sentimentScore: response.data.sentimentScore || 0,
        mentionCount: response.data.mentionCount || 0,
        engagementRate: response.data.engagementRate || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get narrative data for ${narrativeName}:`, error);
      return {
        trendingScore: 0,
        sentimentScore: 0,
        mentionCount: 0,
        engagementRate: 0,
      };
    }
  }

  // Whale Activity Integration
  async getWhaleActivity(whaleAddress: string): Promise<any> {
    try {
      // Example: Integrate with blockchain monitoring service
      // This would typically connect to your existing whale tracking service
      const response = await firstValueFrom(
        this.httpService.get(`/api/whales/${whaleAddress}/activity`)
      );

      return {
        balance: response.data.balance || 0,
        movementAmount: response.data.movementAmount || 0,
        lastTransaction: response.data.lastTransaction || null,
        transactionCount: response.data.transactionCount || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get whale activity for ${whaleAddress}:`, error);
      return {
        balance: 0,
        movementAmount: 0,
        lastTransaction: null,
        transactionCount: 0,
      };
    }
  }

  // Market Data Integration
  async getMarketData(symbol: string): Promise<any> {
    try {
      const [price, volume] = await Promise.all([
        this.getCurrentPrice(symbol),
        this.getCurrentVolume(symbol),
      ]);

      return {
        symbol,
        price,
        volume,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get market data for ${symbol}:`, error);
      return {
        symbol,
        price: 0,
        volume: 0,
        timestamp: new Date(),
      };
    }
  }

  // Social Sentiment Integration
  async getSocialSentiment(symbol: string): Promise<any> {
    try {
      // Example: Integrate with social media sentiment analysis
      const response = await firstValueFrom(
        this.httpService.get(`/api/sentiment/${symbol}`)
      );

      return {
        symbol,
        sentimentScore: response.data.sentimentScore || 0,
        mentionCount: response.data.mentionCount || 0,
        trendingTopics: response.data.trendingTopics || [],
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get social sentiment for ${symbol}:`, error);
      return {
        symbol,
        sentimentScore: 0,
        mentionCount: 0,
        trendingTopics: [],
        timestamp: new Date(),
      };
    }
  }
} 