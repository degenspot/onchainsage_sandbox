import { Injectable } from '@nestjs/common';
import { NarrativeDataSource, PriceDataSource } from '../interfaces/data-source.interface';
import { NarrativeDataPoint, PriceDataPoint } from '../dto/correlation-response.dto';

@Injectable()
export class MockNarrativeDataSource implements NarrativeDataSource {
  async fetchNarrativeData(
    hashtags: string[],
    topics: string[],
    startDate: Date,
    endDate: Date,
    interval: string
  ): Promise<Map<string, NarrativeDataPoint[]>> {
    const data = new Map<string, NarrativeDataPoint[]>();
    
    // Default narratives if none specified
    const allIdentifiers = [
      ...hashtags,
      ...topics,
      ...(hashtags.length === 0 && topics.length === 0 ? ['#bitcoin', '#crypto', 'adoption'] : [])
    ];
    
    // Generate mock data for each identifier
    allIdentifiers.forEach(identifier => {
      data.set(identifier, this.generateMockNarrativeData(startDate, endDate, interval));
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
      // Generate some realistic patterns
      const hourOfDay = current.getHours();
      const dayOfWeek = current.getDay();
      
      // Higher activity during business hours and weekdays
      const baseActivity = (hourOfDay >= 9 && hourOfDay <= 17 && dayOfWeek >= 1 && dayOfWeek <= 5) ? 1.5 : 1.0;
      
      data.push({
        timestamp: new Date(current),
        sentiment: this.generateSentiment(current),
        volume: Math.floor((Math.random() * 5000 + 1000) * baseActivity),
        reach: Math.floor((Math.random() * 50000 + 10000) * baseActivity),
        engagementRate: Math.random() * 0.15 + 0.05, // 5-20%
      });
      
      current.setTime(current.getTime() + intervalMs);
    }

    return data;
  }

  private generateSentiment(timestamp: Date): number {
    // Create some patterns in sentiment based on time
    const hourOfDay = timestamp.getHours();
    const dayOfMonth = timestamp.getDate();
    
    // Base sentiment with some time-based patterns
    let sentiment = Math.sin(dayOfMonth / 31 * Math.PI * 2) * 0.3; // Monthly cycle
    sentiment += Math.sin(hourOfDay / 24 * Math.PI * 2) * 0.2; // Daily cycle
    sentiment += (Math.random() - 0.5) * 0.8; // Random component
    
    // Clamp to -1 to 1 range
    return Math.max(-1, Math.min(1, sentiment));
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

@Injectable()
export class MockPriceDataSource implements PriceDataSource {
  private basePrice: number = 45000; // Starting price for BTC
  
  async fetchPriceData(
    tokenSymbol: string,
    startDate: Date,
    endDate: Date,
    interval: string
  ): Promise<PriceDataPoint[]> {
    const data: PriceDataPoint[] = [];
    const intervalMs = this.getIntervalMs(interval);
    const current = new Date(startDate);
    let currentPrice = this.getBasePriceForToken(tokenSymbol);

    while (current <= endDate) {
      // Generate realistic price movements
      const priceChange = this.generatePriceChange(current, tokenSymbol);
      currentPrice *= (1 + priceChange / 100);
      
      data.push({
        timestamp: new Date(current),
        price: currentPrice,
        volume: this.generateVolume(tokenSymbol, current),
        marketCap: currentPrice * this.getTokenSupply(tokenSymbol),
        priceChange: priceChange,
      });
      
      current.setTime(current.getTime() + intervalMs);
    }

    return data;
  }

  private generatePriceChange(timestamp: Date, tokenSymbol: string): number {
    const hourOfDay = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    
    // Higher volatility during market hours
    const volatilityMultiplier = (hourOfDay >= 9 && hourOfDay <= 16) ? 1.5 : 0.8;
    
    // Weekend has different patterns
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.6 : 1.0;
    
    // Base volatility varies by token
    const baseVolatility = this.getTokenVolatility(tokenSymbol);
    
    // Generate change with some trend and randomness
    const trend = Math.sin(timestamp.getTime() / (1000 * 60 * 60 * 24 * 30)) * 0.5; // Monthly trend
    const randomChange = (Math.random() - 0.5) * 2; // -1 to 1
    
    return (trend + randomChange) * baseVolatility * volatilityMultiplier * weekendMultiplier;
  }

  private generateVolume(tokenSymbol: string, timestamp: Date): number {
    const baseVolume = this.getBaseVolumeForToken(tokenSymbol);
    const hourOfDay = timestamp.getHours();
    
    // Higher volume during active hours
    const activityMultiplier = (hourOfDay >= 8 && hourOfDay <= 20) ? 1.3 : 0.7;
    
    return Math.floor(baseVolume * (0.5 + Math.random()) * activityMultiplier);
  }

  private getBasePriceForToken(tokenSymbol: string): number {
    const basePrices: Record<string, number> = {
      'BTC': 45000,
      'ETH': 3000,
      'ADA': 0.5,
      'SOL': 100,
      'DOGE': 0.08,
      'MATIC': 0.9,
    };
    
    return basePrices[tokenSymbol] || 100;
  }

  private getTokenVolatility(tokenSymbol: string): number {
    const volatilities: Record<string, number> = {
      'BTC': 3.0,
      'ETH': 4.0,
      'ADA': 6.0,
      'SOL': 8.0,
      'DOGE': 15.0,
      'MATIC': 10.0,
    };
    
    return volatilities[tokenSymbol] || 5.0;
  }

  private getTokenSupply(tokenSymbol: string): number {
    const supplies: Record<string, number> = {
      'BTC': 21000000,
      'ETH': 120000000,
      'ADA': 45000000000,
      'SOL': 500000000,
      'DOGE': 140000000000,
      'MATIC': 10000000000,
    };
    
    return supplies[tokenSymbol] || 1000000000;
  }

  private getBaseVolumeForToken(tokenSymbol: string): number {
    const baseVolumes: Record<string, number> = {
      'BTC': 20000000000,
      'ETH': 15000000000,
      'ADA': 1000000000,
      'SOL': 2000000000,
      'DOGE': 500000000,
      'MATIC': 800000000,
    };
    
    return baseVolumes[tokenSymbol] || 1000000000;
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
