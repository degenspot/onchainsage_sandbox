export abstract class BaseStrategy {
    protected config: StrategyConfig;
    protected indicators: Map<string, number[]> = new Map();
  
    constructor(config: StrategyConfig) {
      this.config = config;
    }
  
    abstract generateSignal(data: MarketData[], currentIndex: number): Signal;
  
    protected sma(data: number[], period: number): number[] {
      const result: number[] = [];
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          result.push(NaN);
        } else {
          const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
          result.push(sum / period);
        }
      }
      return result;
    }
  
    protected ema(data: number[], period: number): number[] {
      const result: number[] = [];
      const multiplier = 2 / (period + 1);
      
      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          result.push(data[i]);
        } else {
          result.push((data[i] - result[i - 1]) * multiplier + result[i - 1]);
        }
      }
      return result;
    }
  
    protected rsi(data: number[], period: number = 14): number[] {
      const gains: number[] = [];
      const losses: number[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const change = data[i] - data[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
      }
  
      const avgGains = this.sma(gains, period);
      const avgLosses = this.sma(losses, period);
      
      return avgGains.map((gain, i) => {
        if (isNaN(gain) || isNaN(avgLosses[i]) || avgLosses[i] === 0) return 50;
        const rs = gain / avgLosses[i];
        return 100 - (100 / (1 + rs));
      });
    }
  }
  
  // Example Strategy Implementation
  export class MovingAverageCrossoverStrategy extends BaseStrategy {
    generateSignal(data: MarketData[], currentIndex: number): Signal {
      if (currentIndex < this.config.parameters.longPeriod) {
        return {
          type: 'HOLD',
          timestamp: data[currentIndex].timestamp,
          price: data[currentIndex].close,
          quantity: 0,
          confidence: 0
        };
      }
  
      const prices = data.slice(0, currentIndex + 1).map(d => d.close);
      const shortMA = this.sma(prices, this.config.parameters.shortPeriod);
      const longMA = this.sma(prices, this.config.parameters.longPeriod);
  
      const currentShort = shortMA[currentIndex];
      const currentLong = longMA[currentIndex];
      const prevShort = shortMA[currentIndex - 1];
      const prevLong = longMA[currentIndex - 1];
  
      if (prevShort <= prevLong && currentShort > currentLong) {
        return {
          type: 'BUY',
          timestamp: data[currentIndex].timestamp,
          price: data[currentIndex].close,
          quantity: this.config.riskManagement.maxPositionSize,
          confidence: 0.8
        };
      } else if (prevShort >= prevLong && currentShort < currentLong) {
        return {
          type: 'SELL',
          timestamp: data[currentIndex].timestamp,
          price: data[currentIndex].close,
          quantity: this.config.riskManagement.maxPositionSize,
          confidence: 0.8
        };
      }
  
      return {
        type: 'HOLD',
        timestamp: data[currentIndex].timestamp,
        price: data[currentIndex].close,
        quantity: 0,
        confidence: 0
      };
    }
  }

 