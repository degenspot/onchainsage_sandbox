import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { PriceData } from '../entities/price-data.entity';
import { TokensService } from '../tokens/tokens.service';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    @InjectRepository(PriceData)
    private priceDataRepository: Repository<PriceData>,
    private tokensService: TokensService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async fetchPriceData() {
    this.logger.log('Fetching market data...');
    
    try {
      const tokens = await this.tokensService.findTrackedTokens();
      const symbols = tokens.map(token => token.coingeckoId || token.symbol.toLowerCase()).join(',');
      
      if (!symbols) return;

      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: symbols,
          vs_currencies: 'usd',
          include_24hr_vol: true,
          include_24hr_change: true,
          include_market_cap: true,
        },
      });

      for (const token of tokens) {
        const tokenId = token.coingeckoId || token.symbol.toLowerCase();
        const data = response.data[tokenId];
        
        if (data) {
          await this.savePriceData(token.id, data);
        }
      }
    } catch (error) {
      this.logger.error('Error fetching market data:', error);
    }
  }

  private async savePriceData(tokenId: string, data: any) {
    const priceData = this.priceDataRepository.create({
      tokenId,
      price: data.usd,
      volume24h: data.usd_24h_vol || 0,
      marketCap: data.usd_market_cap || 0,
      priceChange24h: data.usd_24h_change || 0,
      volumeChange24h: 0, // Would need additional API call
    });

    await this.priceDataRepository.save(priceData);
  }

  async getPriceHistory(tokenId: string, hours: number = 24): Promise<PriceData[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.priceDataRepository.find({
      where: { tokenId, timestamp: since },
      order: { timestamp: 'ASC' },
    });
  }

  async getLatestPriceData(tokenId: string): Promise<PriceData | null> {
    return this.priceDataRepository.findOne({
      where: { tokenId },
      order: { timestamp: 'DESC' },
    });
  }
}