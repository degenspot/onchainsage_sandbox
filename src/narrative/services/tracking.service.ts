import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Narrative } from '../models/narrative.model';
import { MomentumService } from './momentum.service';

@Injectable()
export class TrackingService {
  constructor(
    @InjectModel(Narrative.name) private narrativeModel: Model<Narrative>,
    private momentumService: MomentumService,
  ) {}

  async trackNarrativeLifecycle(name: string, socialStats: any): Promise<Narrative> {
    let narrative = await this.narrativeModel.findOne({ name });
    
    const momentumScore = this.momentumService.calculateMomentum(
      narrative || { keywords: [] } as any,
      socialStats
    );

    const growthRate = await this.calculateGrowthRate(name, socialStats.mentionCount);

    if (!narrative) {
      narrative = new this.narrativeModel({
        name,
        momentumScore,
        stage: this.momentumService.determineStage(momentumScore, growthRate),
        firstDetected: new Date(),
      });
    } else {
      narrative.momentumScore = momentumScore;
      narrative.stage = this.momentumService.determineStage(momentumScore, growthRate);
    }

    narrative.lastUpdated = new Date();
    return narrative.save();
  }

  private async calculateGrowthRate(name: string, currentCount: number): Promise<number> {
    const pastData = await this.narrativeModel.findOne({ name })
      .sort({ createdAt: -1 })
      .limit(1);
    
    if (!pastData) return 0;
    const previousCount = pastData['historicalMentions']?.slice(-1)[0]?.count || 0;
    return (currentCount - previousCount) / (previousCount || 1);
  }
}