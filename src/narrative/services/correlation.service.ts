import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Regression } from 'ml-regression';

@Injectable()
export class CorrelationService {
  constructor(private httpService: HttpService) {}

  async correlateNarrativeWithPrices(narrative: string, keywords: string[], assets: string[]) {
    const [socialData, priceData] = await Promise.all([
      this.fetchSocialData(keywords),
      this.fetchPriceData(assets),
    ]);

    const correlations = assets.map(asset => ({
      asset,
      correlation: this.calculateCorrelation(
        socialData.map(d => d.mentionCount),
        priceData[asset].map(d => d.priceChange)
      ),
    }));

    return correlations.sort((a, b) => b.correlation - a.correlation);
  }

  private async fetchSocialData(keywords: string[]) {
    // Implementation to fetch social data by keywords
    const response = await this.httpService.post('/social/search', { keywords }).toPromise();
    return response.data;
  }

  private async fetchPriceData(assets: string[]) {
    // Implementation to fetch price data for assets
    const responses = await Promise.all(
      assets.map(asset => 
        this.httpService.get(`/prices/${asset}`).toPromise()
      )
    );
    return Object.fromEntries(
      assets.map((asset, i) => [asset, responses[i].data])
    );
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    // Pearson correlation implementation
    if (x.length !== y.length) return 0;
    
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
}