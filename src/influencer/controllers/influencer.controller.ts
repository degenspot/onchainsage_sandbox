import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { InfluencerService } from '../services/influencer.service';
import { ImpactMeasurementService } from '../services/impact-measurement.service';
import { ScoringService } from '../services/scoring.service';
import { TrackInfluencerDto } from '../dto/track-influencer.dto';

@Controller('influencers')
export class InfluencerController {
  constructor(
    private readonly influencerService: InfluencerService,
    private readonly impactService: ImpactMeasurementService,
    private readonly scoringService: ScoringService,
  ) {}

  @Post('track')
  async trackInfluencer(@Body() dto: TrackInfluencerDto) {
    const influencer = await this.influencerService.createOrUpdate(dto);
    return influencer;
  }

  @Get(':id/score')
  async getInfluencerScore(@Param('id') id: string) {
    const influencer = await this.influencerService.findById(id);
    const impactHistory = await this.impactService.getImpactHistory(id);
    return {
      score: this.scoringService.calculateInfluenceScore(influencer, impactHistory),
      rank: await this.influencerService.getRank(id),
    };
  }

  @Get('predict-impact/:id')
  async predictImpact(
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    const influencer = await this.influencerService.findById(id);
    return this.predictionService.predictImpact(influencer, content);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.influencerService.getLeaderboard();
  }
}