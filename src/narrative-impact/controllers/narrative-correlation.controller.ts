import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  Param, 
  Delete,
  Logger,
  UseGuards,
  UseInterceptors,
  CacheInterceptor,
  CacheTTL
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { EnhancedNarrativeCorrelationService } from '../services/enhanced-narrative-correlation.service';
import { DataIngestionService } from '../services/data-ingestion.service';
import { CorrelationQueryDto, CorrelationAnalysisResponse } from '../dto/correlation-response.dto';
import { CreateNarrativeDataDto } from '../dto/create-narrative-data.dto';
import { CreatePriceDataDto } from '../dto/create-price-data.dto';
import { NarrativeDataRepository } from '../repositories/narrative-data.repository';
import { PriceDataRepository } from '../repositories/price-data.repository';

@ApiTags('narrative-correlation')
@Controller('narrative-correlation')
@UseInterceptors(CacheInterceptor)
export class NarrativeCorrelationController {
  private readonly logger = new Logger(NarrativeCorrelationController.name);

  constructor(
    private readonly narrativeCorrelationService: EnhancedNarrativeCorrelationService,
    private readonly dataIngestionService: DataIngestionService,
    private readonly narrativeDataRepository: NarrativeDataRepository,
    private readonly priceDataRepository: PriceDataRepository,
  ) {}

  @Get('analyze')
  @ApiOperation({ 
    summary: 'Analyze correlation between trending narratives and token price movements',
    description: 'Provides comprehensive analysis of how specific topics or hashtags have historically impacted token performance, including correlation metrics and trading patterns.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Correlation analysis completed successfully',
    type: CorrelationAnalysisResponse 
  })
  @CacheTTL(300) // 5 minutes cache
  async analyzeCorrelations(
    @Query() query: CorrelationQueryDto,
  ): Promise<CorrelationAnalysisResponse> {
    this.logger.log(`Received correlation analysis request for token: ${query.tokenSymbol}`);
    return this.narrativeCorrelationService.analyzeCorrelations(query);
  }

  @Get('patterns/:tokenSymbol')
  @ApiOperation({
    summary: 'Get historical trading patterns for a specific token',
    description: 'Returns identified patterns that show correlation between narrative trends and price movements.'
  })
  @ApiParam({ name: 'tokenSymbol', description: 'Token symbol (e.g., BTC, ETH)' })
  @CacheTTL(600) // 10 minutes cache
  async getTradingPatterns(
    @Param('tokenSymbol') tokenSymbol: string,
    @Query('minConfidence') minConfidence?: number,
  ) {
    const patterns = await this.narrativeCorrelationService.getHighConfidencePatterns(tokenSymbol);
    
    return {
      tokenSymbol,
      patterns: minConfidence 
        ? patterns.filter(p => p.confidence >= minConfidence)
        : patterns,
      metadata: {
        totalPatterns: patterns.length,
        lastUpdated: new Date()
      }
    };
  }

  @Get('insights/:tokenSymbol')
  @ApiOperation({
    summary: 'Get actionable insights from narrative-price correlations',
    description: 'Provides summarized insights and recommendations based on historical correlation analysis.'
  })
  @ApiParam({ name: 'tokenSymbol', description: 'Token symbol (e.g., BTC, ETH)' })
  @CacheTTL(300) // 5 minutes cache
  async getInsights(
    @Param('tokenSymbol') tokenSymbol: string,
  ) {
    const [correlations, patterns] = await Promise.all([
      this.narrativeCorrelationService.getStrongCorrelations(tokenSymbol),
      this.narrativeCorrelationService.getHighConfidencePatterns(tokenSymbol),
    ]);
    
    const insights = {
      tokenSymbol,
      keyFindings: {
        strongestCorrelation: correlations[0] || null,
        totalStrongCorrelations: correlations.length,
        mostReliablePatterns: patterns.slice(0, 3),
        averageCorrelationStrength: correlations.length > 0 
          ? correlations.reduce((sum, c) => sum + Math.abs(c.pearsonCorrelation), 0) / correlations.length
          : 0
      },
      recommendations: this.generateRecommendations(correlations, patterns),
      riskFactors: this.identifyRiskFactors(correlations, patterns),
      lastAnalyzed: new Date()
    };

    return insights;
  }

  @Get('historical/:tokenSymbol')
  @ApiOperation({
    summary: 'Get historical correlation data',
    description: 'Returns historical correlation analysis data for trend analysis.'
  })
  @ApiParam({ name: 'tokenSymbol', description: 'Token symbol (e.g., BTC, ETH)' })
  async getHistoricalData(
    @Param('tokenSymbol') tokenSymbol: string,
    @Query('days') days: number = 30,
  ) {
    const historicalData = await this.narrativeCorrelationService.getHistoricalCorrelations(tokenSymbol, days);
    
    return {
      tokenSymbol,
      timeframe: `${days} days`,
      correlations: historicalData,
      summary: {
        totalAnalyses: historicalData.length,
        averageCorrelation: historicalData.length > 0
          ? historicalData.reduce((sum, h) => sum + Math.abs(h.pearsonCorrelation), 0) / historicalData.length
          : 0,
        strongCorrelationsCount: historicalData.filter(h => h.strength === 'strong' || h.strength === 'very_strong').length
      }
    };
  }

  @Post('narrative-data')
  @ApiOperation({
    summary: 'Add narrative data',
    description: 'Manually add narrative data points for analysis.'
  })
  @ApiResponse({ status: 201, description: 'Narrative data created successfully' })
  async createNarrativeData(@Body() createDto: CreateNarrativeDataDto) {
    return this.narrativeDataRepository.create(createDto);
  }

  @Post('narrative-data/bulk')
  @ApiOperation({
    summary: 'Bulk add narrative data',
    description: 'Add multiple narrative data points at once.'
  })
  @ApiResponse({ status: 201, description: 'Narrative data created successfully' })
  async bulkCreateNarrativeData(@Body() createDtos: CreateNarrativeDataDto[]) {
    return this.narrativeDataRepository.bulkCreate(createDtos);
  }

  @Post('price-data')
  @ApiOperation({
    summary: 'Add price data',
    description: 'Manually add price data points for analysis.'
  })
  @ApiResponse({ status: 201, description: 'Price data created successfully' })
  async createPriceData(@Body() createDto: CreatePriceDataDto) {
    return this.priceDataRepository.create(createDto);
  }

  @Post('price-data/bulk')
  @ApiOperation({
    summary: 'Bulk add price data',
    description: 'Add multiple price data points at once.'
  })
  @ApiResponse({ status: 201, description: 'Price data created successfully' })
  async bulkCreatePriceData(@Body() createDtos: CreatePriceDataDto[]) {
    return this.priceDataRepository.bulkCreate(createDtos);
  }

  @Post('ingest/manual')
  @ApiOperation({
    summary: 'Manually trigger data ingestion',
    description: 'Trigger manual data ingestion from external sources.'
  })
  @ApiResponse({ status: 200, description: 'Data ingestion triggered successfully' })
  async triggerManualIngestion() {
    await this.dataIngestionService.ingestHourlyData();
    return { message: 'Data ingestion completed successfully', timestamp: new Date() };
  }

  @Get('top-narratives/:tokenSymbol')
  @ApiOperation({
    summary: 'Get top narratives by volume',
    description: 'Returns the most mentioned narratives for a token in a given timeframe.'
  })
  @ApiParam({ name: 'tokenSymbol', description: 'Token symbol (e.g., BTC, ETH)' })
  async getTopNarratives(
    @Param('tokenSymbol') tokenSymbol: string,
    @Query('days') days: number = 7,
    @Query('limit') limit: number = 10,
  ) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topNarratives = await this.narrativeDataRepository.findTopIdentifiersByVolume(
      tokenSymbol,
      startDate,
      endDate,
      limit
    );

    return {
      tokenSymbol,
      timeframe: `${days} days`,
      narratives: topNarratives,
      metadata: {
        totalNarratives: topNarratives.length,
        analyzedFrom: startDate,
        analyzedTo: endDate
      }
    };
  }

  @Delete('cleanup/old-data')
  @ApiOperation({
    summary: 'Clean up old data',
    description: 'Remove old data beyond retention period.'
  })
  @ApiResponse({ status: 200, description: 'Data cleanup completed successfully' })
  async cleanupOldData() {
    await this.dataIngestionService.cleanupOldData();
    return { message: 'Old data cleanup completed successfully', timestamp: new Date() };
  }

  private generateRecommendations(correlations: any[], patterns: any[]): string[] {
    const recommendations: string[] = [];
    
    const strongPositiveCorrelations = correlations.filter(c => c.pearsonCorrelation > 0.5);
    
    if (strongPositiveCorrelations.length > 0) {
      recommendations.push(
        `Monitor ${strongPositiveCorrelations[0].identifier} sentiment - positive sentiment historically correlates with price increases`
      );
    }

    const priceSpikePatter = patterns.find(p => p.patternType === 'price_spike_after_sentiment');
    
    if (priceSpikePatter) {
      recommendations.push(
        `Consider positions when sentiment spikes occur - historical average delay is ${priceSpikePatter.avgTimeDelay.toFixed(1)} hours with ${priceSpikePatter.avgPriceImpact.toFixed(2)}% average impact`
      );
    }

    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.85);
    if (highConfidencePatterns.length > 0) {
      recommendations.push(
        `${highConfidencePatterns.length} high-confidence patterns detected - consider automated alerts for these scenarios`
      );
    }

    return recommendations;
  }

  private identifyRiskFactors(correlations: any[], patterns: any[]): string[] {
    const riskFactors: string[] = [];
    
    if (correlations.length < 5) {
      riskFactors.push('Limited correlation data - analysis may not be statistically robust');
    }

    const highVolatilityPatterns = patterns.filter(p => Math.abs(p.avgPriceImpact) > 15);
    
    if (highVolatilityPatterns.length > 0) {
      riskFactors.push('High volatility patterns detected - significant price swings possible');
    }

    const weakCorrelations = correlations.filter(c => Math.abs(c.pearsonCorrelation) < 0.3);
    
    if (weakCorrelations.length > correlations.length * 0.7) {
      riskFactors.push('Most correlations are weak - narrative impact may be limited');
    }

    const lowConfidencePatterns = patterns.filter(p => p.confidence < 0.7);
    if (lowConfidencePatterns.length > patterns.length * 0.5) {
      riskFactors.push('Many patterns have low confidence - results may be unreliable');
    }

    return riskFactors;
  }
}
