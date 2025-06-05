import { Injectable } from '@nestjs/common';
import { Influencer } from '../models/influencer.model';

@Injectable()
export class ScoringService {
  calculateInfluenceScore(influencer: Influencer, impactHistory: any[]): number {
    // Weighted scoring algorithm
    const followerWeight = 0.3;
    const engagementWeight = 0.2;
    const impactWeight = 0.5;

    // Normalize values (example normalization)
    const normalizedFollowers = Math.min(influencer.followers / 1000000, 1);
    const normalizedEngagement = Math.min(influencer.engagementRate / 10, 1);
    
    // Calculate average impact score
    const avgImpact = impactHistory.length > 0 
      ? impactHistory.reduce((sum, item) => sum + item.impactScore, 0) / impactHistory.length 
      : 0;
    const normalizedImpact = Math.min(avgImpact / 20, 1); // Assuming impactScore is 0-20

    return (
      (normalizedFollowers * followerWeight) +
      (normalizedEngagement * engagementWeight) +
      (normalizedImpact * impactWeight)
    ) * 100; // Convert to 0-100 scale
  }

  calculatePostImpactScore(impactMetrics: {
    priceImpact: number;
    volumeImpact: number;
    sentimentImpact: number;
  }): number {
    // Weighted impact score calculation
    const weights = {
      price: 0.6,
      volume: 0.3,
      sentiment: 0.1
    };

    return (
      (Math.abs(impactMetrics.priceImpact) * weights.price) +
      (impactMetrics.volumeImpact * weights.volume) +
      (impactMetrics.sentimentImpact * weights.sentiment)
    );
  }
}