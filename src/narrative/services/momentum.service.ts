import { Injectable } from '@nestjs/common';
import { Narrative } from '../models/narrative.model';

@Injectable()
export class MomentumService {
  calculateMomentum(narrative: Narrative, socialStats: {
    mentionCount: number;
    mentionGrowth: number;
    sentiment: number;
    influencerCount: number;
  }): number {
    // Weighted momentum calculation
    const weights = {
      mentionCount: 0.3,
      mentionGrowth: 0.4,
      sentiment: 0.2,
      influencerCount: 0.1
    };

    // Normalize values (example normalization)
    const normalizedMentionCount = Math.min(socialStats.mentionCount / 1000, 1);
    const normalizedMentionGrowth = Math.min(socialStats.mentionGrowth / 100, 1);
    const normalizedSentiment = (socialStats.sentiment + 1) / 2; // Convert -1 to 1 range to 0-1
    const normalizedInfluencerCount = Math.min(socialStats.influencerCount / 10, 1);

    return (
      (normalizedMentionCount * weights.mentionCount) +
      (normalizedMentionGrowth * weights.mentionGrowth) +
      (normalizedSentiment * weights.sentiment) +
      (normalizedInfluencerCount * weights.influencerCount)
    ) * 100; // Scale to 0-100
  }

  determineStage(momentumScore: number, growthRate: number): string {
    if (momentumScore > 80 && growthRate > 0.5) return 'peak';
    if (momentumScore > 50 && growthRate > 0.2) return 'growing';
    if (momentumScore < 30 && growthRate < 0) return 'declining';
    return 'emerging';
  }
}