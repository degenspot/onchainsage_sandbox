import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { TokenLifecycleService } from '../services/token-lifecycle.service';
import { LifecycleAnalyzerService } from '../services/lifecycle-analyzer.service';
import { PatternRecognitionService } from '../services/pattern-recognition.service';
import { PredictiveModelingService } from '../services/predictive-modeling.service';
import { AutomatedCategorizationService } from '../services/automated-categorization.service';
import { CreateTokenDto, UpdateTokenStageDto, TokenMetricsDto } from '../dto/token-lifecycle.dto';

@Controller('token-lifecycle')
export class TokenLifecycleController {
  constructor(
    private readonly tokenLifecycleService: TokenLifecycleService,
    private readonly lifecycleAnalyzer: LifecycleAnalyzerService,
    private readonly patternRecognition: PatternRecognitionService,
    private readonly predictiveModeling: PredictiveModelingService,
    private readonly categorization: AutomatedCategorizationService
  ) {}

  @Post('tokens')
  async createToken(@Body() createTokenDto: CreateTokenDto) {
    return this.tokenLifecycleService.createToken(createTokenDto);
  }

  @Get('tokens/:id')
  async getToken(@Param('id') id: string) {
    return this.tokenLifecycleService.getTokenById(id);
  }

  @Get('tokens')
  async getTokens(
    @Query('category') category?: string,
    @Query('stage') stage?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0
  ) {
    return this.tokenLifecycleService.getTokens({ category, stage, limit, offset });
  }

  @Put('tokens/:id/stage')
  async updateTokenStage(
    @Param('id') id: string,
    @Body() updateStageDto: UpdateTokenStageDto
  ) {
    return this.tokenLifecycleService.updateTokenStage(id, updateStageDto);
  }

  @Post('tokens/:id/metrics')
  async addTokenMetrics(
    @Param('id') tokenId: string,
    @Body() metricsDto: TokenMetricsDto
  ) {
    return this.tokenLifecycleService.addTokenMetrics(tokenId, metricsDto);
  }

  @Get('tokens/:id/analyze')
  async analyzeTokenStage(@Param('id') id: string) {
    return this.lifecycleAnalyzer.analyzeTokenStage(id);
  }

  @Get('tokens/:id/predict')
  async predictTokenSuccess(@Param('id') id: string) {
    return this.predictiveModeling.predictTokenSuccess(id);
  }

  @Post('tokens/:id/categorize')
  async categorizeToken(@Param('id') id: string) {
    return this.categorization.categorizeToken(id);
  }

  @Post('patterns/identify')
  async identifyPatterns() {
    return this.patternRecognition.identifySuccessPatterns();
  }

  @Get('patterns')
  async getPatterns() {
    return this.tokenLifecycleService.getPatterns();
  }

  @Get('analytics/lifecycle-distribution')
  async getLifecycleDistribution() {
    return this.tokenLifecycleService.getLifecycleDistribution();
  }

  @Get('analytics/success-metrics')
  async getSuccessMetrics() {
    return this.tokenLifecycleService.getSuccessMetrics();
  }

  @Get('visualization/lifecycle-flow')
  async getLifecycleFlow() {
    return this.tokenLifecycleService.getLifecycleFlowData();
  }

  @Post('categorization/batch')
  async batchCategorize() {
    return this.categorization.batchCategorizeTokens();
  }
}