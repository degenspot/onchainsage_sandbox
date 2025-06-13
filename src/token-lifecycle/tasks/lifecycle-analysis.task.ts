import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LifecycleAnalyzerService } from '../services/lifecycle-analyzer.service';
import { PatternRecognitionService } from '../services/pattern-recognition.service';
import { AutomatedCategorizationService } from '../services/automated-categorization.service';
import { TokenLifecycleService } from '../services/token-lifecycle.service';

@Injectable()
export class LifecycleAnalysisTask {
  private readonly logger = new Logger(LifecycleAnalysisTask.name);

  constructor(
    private readonly lifecycleAnalyzer: LifecycleAnalyzerService,
    private readonly patternRecognition: PatternRecognitionService,
    private readonly categorization: AutomatedCategorizationService,
    private readonly tokenService: TokenLifecycleService
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async analyzeTokenStages() {
    this.logger.log('Starting hourly token stage analysis...');
    
    try {
      const { tokens } = await this.tokenService.getTokens({
        limit: 100,
        offset: 0
      });

      let analyzed = 0;
      let updated = 0;

      for (const token of tokens) {
        try {
          const analysis = await this.lifecycleAnalyzer.analyzeTokenStage(token.id);
          analyzed++;

          if (analysis.stage !== token.currentStage && analysis.confidence > 0.7) {
            await this.tokenService.updateTokenStage(token.id, {
              stage: analysis.stage,
              confidence: analysis.confidence,
              triggerFactors: { automated: true, timestamp: new Date() }
            });
            updated++;
          }
        } catch (error) {
          this.logger.error(`Failed to analyze token ${token.symbol}: ${error.message}`);
        }
      }

      this.logger.log(`Analyzed ${analyzed} tokens, updated ${updated} stages`);
    } catch (error) {
      this.logger.error('Hourly analysis failed:', error);
    }
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async updatePatternRecognition() {
    this.logger.log('Starting pattern recognition update...');
    
    try {
      const patterns = await this.patternRecognition.identifySuccessPatterns();
      this.logger.log(`Identified ${patterns.length} success patterns`);
    } catch (error) {
      this.logger.error('Pattern recognition failed:', error);
    }
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async performAutomatedCategorization() {
    this.logger.log('Starting automated categorization...');
    
    try {
      const result = await this.categorization.batchCategorizeTokens();
      this.logger.log(`Categorized ${result.updated} tokens, ${result.errors.length} errors`);
    } catch (error) {
      this.logger.error('Automated categorization failed:', error);
    }
  }
}
