import { NarrativeDataSource, PriceDataSource } from '../interfaces/data-source.interface';
import { NarrativeDataPoint, PriceDataPoint } from '../dto/correlation-response.dto';

export class MockNarrativeDataSource implements NarrativeDataSource {
  async fetchNarrativeData(
    hashtags: string[],
    topics: string[],
    startDate: Date,
    endDate: Date,
    interval: string
  ): Promise<Map<string, NarrativeDataPoint[]>> {
    const data = new Map<string, NarrativeDataPoint[]>();
    
    // Generate mock data for hashtags
    hashtags.forEach(hashtag => {
      data.set(hashtag, this.generateMockNarrativeData(startDate, endDate, interval));
    });
    
    // Generate mock data for topics
    topics.forEach(topic => {
      data.set(topic, this.generateMockNarrativeData(startDate, endDate, interval));
    });
    
    return data;
  }

  private generateMockNarrativeData(
    startDate: Date,
    endDate: Date,
    interval: string
  ): NarrativeDataPoint[] {
    const data: NarrativeDataPoint[] = [];
    const intervalMs = this.getIntervalMs(interval);
    const current = new Date(startDate);

    while (current <= endDate) {
      data.push({
        timestamp: new Date(current),
        sentiment: Math.random() * 2 - 1, // -1 to 1
        volume: Math.floor(Math.random() * 10000),
        reach: Math.floor(Math.random() * 100000),
        engagementRate: Math.random() * 0.2,
      });
      
      current.setTime(current.getTime() + intervalMs);
    }

    return data;
  }

  private getIntervalMs(interval: string): number {
    switch (interval) {
      case '1h': return 60 * 60 * 1000;
      case '4h': return 4 * 60 * 60 * 1000;
      case '1d': return 24 * 60 * 60 * 1000;
      case '1w': return 7 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }
}

export class MockPriceDataSource implements PriceDataSource {
  async fetchPriceData(
    tokenSymbol: string,
    startDate: Date,
    endDate: Date,
    interval: string
  ): Promise<PriceDataPoint[]> {
    const data: PriceDataPoint[] = [];
    const intervalMs = this.getIntervalMs(interval);
    const current = new Date(startDate);
    let basePrice = this.getBasePriceForToken(tokenSymbol);

    while (current <= endDate) {
      const priceChange = (Math.random() - 0.5) * 0.1; // ±5% max change
      basePrice *= (1 + priceChange);
      
      data.push({
        timestamp: new Date(current),
        price: basePrice,
        volume: Math.floor(Math.random() * 5000000000),
        marketCap: basePrice * 21000000, // Assuming Bitcoin-like supply
        priceChange: priceChange * 100, // Convert to percentage
      });
      
      current.setTime(current.getTime() + intervalMs);
    }

    return data;
  }

  private getBasePriceForToken(tokenSymbol: string): number {
    const basePrices: Record<string, number> = {
      'BTC': 45000,
      'ETH': 3000,
      'ADA': 0.5,
      'SOL': 100,
    };
    
    return basePrices[tokenSymbol] || 100;
  }

  private getIntervalMs(interval: string): number {
    switch (interval) {
      case '1h': return 60 * 60 * 1000;
      case '4h': return 4 * 60 * 60 * 1000;
      case '1d': return 24 * 60 * 60 * 1000;
      case '1w': return 7 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }
}