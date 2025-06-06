import { Injectable } from '@nestjs/common';
import { Influencer } from '../models/influencer.model';
import { Regression } from 'ml-regression';

@Injectable()
export class PredictionService {
  predictImpact(influencer: Influencer, postContent: string): number {
    // In a real implementation, you would use a trained ML model
    // This is a simplified example using linear regression
    
    // Mock historical data - replace with actual data from your DB
    const historicalData = [
      { followers: 10000, engagement: 2.5, impact: 3.2 },
      { followers: 50000, engagement: 3.8, impact: 5.6 },
      // ... more data points
    ];

    const x = historicalData.map(d => [d.followers, d.engagement]);
    const y = historicalData.map(d => d.impact);
    
    const regression = new Regression.LinearRegression(x, y);
    const prediction = regression.predict([
      influencer.followers,
      influencer.engagementRate
    ]);
    
    // Adjust based on sentiment keywords
    const sentimentScore = this.estimateSentiment(postContent);
    return prediction * (1 + (sentimentScore / 10));
  }

  private estimateSentiment(content: string): number {
    // Simplified sentiment estimation
    const positiveKeywords = ['buy', 'bullish', 'growth'];
    const negativeKeywords = ['sell', 'bearish', 'warning'];
    
    let score = 0;
    const text = content.toLowerCase();
    
    positiveKeywords.forEach(word => { if(text.includes(word)) score += 1; });
    negativeKeywords.forEach(word => { if(text.includes(word)) score -= 1; });
    
    return score;
  }
}