 
  import { Injectable } from '@nestjs/common';
  
  @Injectable()
  export class DataProcessingService {
    async loadHistoricalData(
      symbol: string,
      startDate: Date,
      endDate: Date,
      interval: string = '1d'
    ): Promise<MarketData[]> {
      // In a real implementation, this would fetch from a database or API
      // For demo purposes, generating sample data
      const data: MarketData[] = [];
      const current = new Date(startDate);
      let price = 100;
  
      while (current <= endDate) {
        const change = (Math.random() - 0.5) * 4;
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * 2;
        const low = Math.min(open, close) - Math.random() * 2;
  
        data.push({
          timestamp: new Date(current),
          symbol,
          open,
          high,
          low,
          close,
          volume: Math.floor(Math.random() * 1000000) + 100000
        });
  
        price = close;
        current.setDate(current.getDate() + 1);
      }
  
      return data;
    }
  
    validateData(data: MarketData[]): boolean {
      return data.every(d => 
        d.high >= Math.max(d.open, d.close) &&
        d.low <= Math.min(d.open, d.close) &&
        d.volume > 0
      );
    }
  
    cleanData(data: MarketData[]): MarketData[] {
      return data.filter(d => 
        !isNaN(d.open) && !isNaN(d.high) && 
        !isNaN(d.low) && !isNaN(d.close) && 
        d.volume > 0
      );
    }
  }