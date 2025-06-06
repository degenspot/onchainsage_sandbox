import { Controller, Get, Post, Body, Sse } from '@nestjs/common';
import { ExtractionService } from '../services/extraction.service';
import { TrackingService } from '../services/tracking.service';
import { CorrelationService } from '../services/correlation.service';
import { AlertService } from '../services/alert.service';
import { DetectNarrativeDto } from '../dto/detect-narrative.dto';
import { Observable } from 'rxjs';

@Controller('narratives')
export class NarrativeController {
  constructor(
    private extractionService: ExtractionService,
    private trackingService: TrackingService,
    private correlationService: CorrelationService,
    private alertService: AlertService,
  ) {}

  @Post('detect')
  async detectNarratives(@Body() dto: DetectNarrativeDto) {
    const narratives = await this.extractionService.detectNarrativesFromSocial(dto.socialData);
    
    const results = await Promise.all(
      narratives.map(async name => {
        const narrative = await this.trackingService.trackNarrativeLifecycle(name, {
          mentionCount: dto.socialData.filter(post => 
            post.content.toLowerCase().includes(name.toLowerCase())
          ).length,
          mentionGrowth: 0, // Will be calculated in tracking service
          sentiment: this.calculateAverageSentiment(dto.socialData, name),
          influencerCount: new Set(
            dto.socialData
              .filter(post => post.content.toLowerCase().includes(name.toLowerCase()))
              .map(post => post.authorId)
          ).size,
        });

        const correlations = await this.correlationService.correlateNarrativeWithPrices(
          name,
          [name, ...narrative.keywords],
          dto.assetsToTrack
        );

        return {
          narrative,
          correlatedAssets: correlations,
        };
      })
    );

    return results;
  }

  @Get('dashboard')
  async getDashboardData() {
    const narratives = await this.trackingService.getActiveNarratives();
    return {
      narratives: narratives.map(n => ({
        name: n.name,
        stage: n.stage,
        momentum: n.momentumScore,
        keywords: n.keywords,
        relatedAssets: Array.from(n.relatedAssets.entries()),
      })),
      trends: await this.trackingService.getRecentTrends(),
    };
  }

  @Sse('alerts')
  sseAlerts(): Observable<MessageEvent> {
    return new Observable(subscriber => {
      this.alertService.on('narrative.*', (data) => {
        subscriber.next({ data });
      });
    });
  }

  private calculateAverageSentiment(socialData: any[], narrative: string): number {
    const relevantPosts = socialData.filter(post => 
      post.content.toLowerCase().includes(narrative.toLowerCase())
    );
    if (relevantPosts.length === 0) return 0;
    
    return (
      relevantPosts.reduce((sum, post) => sum + (post.sentiment || 0), 0) / 
      relevantPosts.length
    );
  }
}