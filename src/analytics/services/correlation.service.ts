import { Injectable } from '@nestjs/common';
import { NormalizedChainData } from '../../shared/interfaces/normalized-chain-data.interface';

@Injectable()
export class CorrelationService {
  calculateCorrelation(
    chainDataA: NormalizedChainData[],
    chainDataB: NormalizedChainData[],
  ): { score: number; lag: number } {
    // Implement Pearson correlation or other metric
    const alignedData = this.alignTimestamps(chainDataA, chainDataB);
    
    const correlation = this.pearsonCorrelation(
      alignedData.map(d => d.valueA),
      alignedData.map(d => d.valueB),
    );

    return {
      score: correlation,
      lag: this.calculateLag(alignedData),
    };
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    // Implementation of Pearson correlation coefficient
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
    const sumX2 = x.reduce((acc, val) => acc + val * val, 0);
    const sumY2 = y.reduce((acc, val) => acc + val * val, 0);
    
    const numerator = sumXY - (sumX * sumY) / n;
    const denominator = Math.sqrt((sumX2 - (sumX * sumX) / n) * (sumY2 - (sumY * sumY) / n));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private alignTimestamps(chainA: NormalizedChainData[], chainB: NormalizedChainData[]) {
    // Align data points by timestamp
    // Implementation omitted for brevity
    return [];
  }

  private calculateLag(alignedData: any[]): number {
    // Calculate time lag between trends
    // Implementation omitted for brevity
    return 0;
  }
}