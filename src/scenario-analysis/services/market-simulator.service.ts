import { Injectable, Logger } from '@nestjs/common';
import { MarketCondition } from '../interfaces/scenario-analysis.interfaces';

@Injectable()
export class MarketSimulatorService {
  private readonly logger = new Logger(MarketSimulatorService.name);

  async simulateMarketConditions(
    initialConditions: MarketCondition[],
    duration: number
  ): Promise<MarketCondition[]> {
    this.logger.log('Simulating market conditions');
    
    const simulatedConditions: MarketCondition[] = [];
    const stepsPerDay = 24; // Hourly data
    const totalSteps = duration * stepsPerDay;

    for (const condition of initialConditions) {
      const symbolConditions = this.simulateSymbol(condition, totalSteps);
      simulatedConditions.push(...symbolConditions);
    }

    return simulatedConditions;
  }

  private simulateSymbol(initialCondition: MarketCondition, steps: number): MarketCondition[] {
    const conditions: MarketCondition[] = [];
    let currentPrice = initialCondition.price;
    const dt = 1 / (24 * 365); // 1 hour in years
    const drift = 0.05; // 5% annual drift
    const volatility = initialCondition.volatility;

    for (let i = 0; i < steps; i++) {
      // Geometric Brownian Motion
      const randomShock = this.gaussianRandom();
      const priceChange = currentPrice * (drift * dt + volatility * Math.sqrt(dt) * randomShock);
      currentPrice += priceChange;

      // Simulate volume changes
      const volumeChange = 1 + (Math.random() - 0.5) * 0.2; // ±10% volume variation
      const newVolume = Math.floor(initialCondition.volume * volumeChange);

      conditions.push({
        symbol: initialCondition.symbol,
        price: Math.max(currentPrice, 0.01), // Ensure price doesn't go negative
        volatility: volatility * (1 + (Math.random() - 0.5) * 0.1), // Slight volatility changes
        volume: newVolume,
        timestamp: new Date(Date.now() + i * 60 * 60 * 1000), // Hourly timestamps
      });
    }

    return conditions;
  }

  async simulateGeometricBrownianMotion(
    initialPrice: number,
    drift: number,
    volatility: number,
    timeHorizon: number,
    steps: number
  ): Promise<number[]> {
    const prices: number[] = [initialPrice];
    const dt = timeHorizon / steps;

    for (let i = 1; i <= steps; i++) {
      const randomShock = this.gaussianRandom();
      const prevPrice = prices[i - 1];
      const newPrice = prevPrice * Math.exp(
        (drift - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * randomShock
      );
      prices.push(newPrice);
    }

    return prices;
  }

  async simulateJumpDiffusion(
    initialPrice: number,
    drift: number,
    volatility: number,
    jumpIntensity: number,
    jumpMean: number,
    jumpStd: number,
    timeHorizon: number,
    steps: number
  ): Promise<number[]> {
    const prices: number[] = [initialPrice];
    const dt = timeHorizon / steps;

    for (let i = 1; i <= steps; i++) {
      const randomShock = this.gaussianRandom();
      const prevPrice = prices[i - 1];
      
      // Standard GBM component
      let logReturn = (drift - 0.5 * volatility * volatility) * dt + volatility * Math.sqrt(dt) * randomShock;
      
      // Jump component
      if (Math.random() < jumpIntensity * dt) {
        const jumpSize = jumpMean + jumpStd * this.gaussianRandom();
        logReturn += jumpSize;
      }
      
      const newPrice = prevPrice * Math.exp(logReturn);
      prices.push(newPrice);
    }

    return prices;
  }

  private gaussianRandom(): number {
    // Box-Muller transformation for Gaussian random numbers
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}