import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PredictionMarketService } from '../services/prediction-market.service';
import { MarketParticipationService } from '../services/market-participation.service';
import { MarketResolutionService } from '../services/market-resolution.service';
import { MarketAnalyticsService } from '../services/market-analytics.service';
import { CreateMarketDto } from '../dto/create-market.dto';
import { ParticipateMarketDto } from '../dto/participate-market.dto';
import { ResolveMarketDto } from '../dto/resolve-market.dto';

@ApiTags('Prediction Markets')
@Controller('prediction-markets')
export class PredictionMarketController {
  constructor(
    private readonly predictionMarketService: PredictionMarketService,
    private readonly marketParticipationService: MarketParticipationService,
    private readonly marketResolutionService: MarketResolutionService,
    private readonly marketAnalyticsService: MarketAnalyticsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new prediction market' })
  @ApiResponse({ status: 201, description: 'Market created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid market data' })
  async createMarket(@Body() createMarketDto: CreateMarketDto, @Request() req: any) {
    return this.predictionMarketService.createMarket(createMarketDto, req.user?.id || 'anonymous');
  }

  @Get()
  @ApiOperation({ summary: 'Get all prediction markets' })
  @ApiResponse({ status: 200, description: 'Markets retrieved successfully' })
  async getAllMarkets(
    @Query('status') status?: string,
    @Query('marketType') marketType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.predictionMarketService.getAllMarkets(status, marketType, page, limit);
  }

  @Get('open')
  @ApiOperation({ summary: 'Get open prediction markets' })
  @ApiResponse({ status: 200, description: 'Open markets retrieved successfully' })
  async getOpenMarkets() {
    return this.predictionMarketService.getOpenMarkets();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search prediction markets' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchMarkets(@Query('q') query: string) {
    return this.predictionMarketService.searchMarkets(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prediction market by ID' })
  @ApiResponse({ status: 200, description: 'Market retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Market not found' })
  async getMarketById(@Param('id') id: string) {
    return this.predictionMarketService.getMarketById(id);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get market analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getMarketAnalytics(@Param('id') id: string) {
    return this.predictionMarketService.getMarketAnalytics(id);
  }

  @Post(':id/participate')
  @ApiOperation({ summary: 'Participate in a prediction market' })
  @ApiResponse({ status: 201, description: 'Participation successful' })
  @ApiResponse({ status: 400, description: 'Invalid participation data' })
  async participateInMarket(
    @Param('id') marketId: string,
    @Body() participateMarketDto: ParticipateMarketDto,
    @Request() req: any,
  ) {
    participateMarketDto.marketId = marketId;
    return this.marketParticipationService.participateInMarket(participateMarketDto, req.user?.id || 'anonymous');
  }

  @Get('participations/user')
  @ApiOperation({ summary: 'Get user participations' })
  @ApiResponse({ status: 200, description: 'Participations retrieved successfully' })
  async getUserParticipations(@Request() req: any) {
    return this.marketParticipationService.getUserParticipations(req.user?.id || 'anonymous');
  }

  @Get(':id/participations')
  @ApiOperation({ summary: 'Get market participations' })
  @ApiResponse({ status: 200, description: 'Participations retrieved successfully' })
  async getMarketParticipations(@Param('id') marketId: string) {
    return this.marketParticipationService.getMarketParticipations(marketId);
  }

  @Post('participations/:participationId/claim')
  @ApiOperation({ summary: 'Claim winnings from participation' })
  @ApiResponse({ status: 200, description: 'Winnings claimed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot claim winnings' })
  async claimWinnings(@Param('participationId') participationId: string, @Request() req: any) {
    return this.marketParticipationService.claimWinnings(participationId, req.user?.id || 'anonymous');
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve a prediction market' })
  @ApiResponse({ status: 201, description: 'Market resolved successfully' })
  @ApiResponse({ status: 400, description: 'Cannot resolve market' })
  async resolveMarket(
    @Param('id') marketId: string,
    @Body() resolveMarketDto: ResolveMarketDto,
    @Request() req: any,
  ) {
    resolveMarketDto.marketId = marketId;
    return this.marketResolutionService.resolveMarket(resolveMarketDto, req.user?.id || 'anonymous');
  }

  @Put('resolutions/:resolutionId/approve')
  @ApiOperation({ summary: 'Approve a market resolution' })
  @ApiResponse({ status: 200, description: 'Resolution approved successfully' })
  async approveResolution(@Param('resolutionId') resolutionId: string, @Request() req: any) {
    return this.marketResolutionService.approveResolution(resolutionId, req.user?.id || 'anonymous');
  }

  @Put('resolutions/:resolutionId/reject')
  @ApiOperation({ summary: 'Reject a market resolution' })
  @ApiResponse({ status: 200, description: 'Resolution rejected successfully' })
  async rejectResolution(
    @Param('resolutionId') resolutionId: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    return this.marketResolutionService.rejectResolution(resolutionId, req.user?.id || 'anonymous', body.reason);
  }

  @Get('analytics/global')
  @ApiOperation({ summary: 'Get global analytics' })
  @ApiResponse({ status: 200, description: 'Global analytics retrieved successfully' })
  async getGlobalAnalytics() {
    return this.marketAnalyticsService.getGlobalAnalytics();
  }

  @Get('analytics/market-types')
  @ApiOperation({ summary: 'Get market type analytics' })
  @ApiResponse({ status: 200, description: 'Market type analytics retrieved successfully' })
  async getMarketTypeAnalytics() {
    return this.marketAnalyticsService.getMarketTypeAnalytics();
  }

  @Get('analytics/user')
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved successfully' })
  async getUserAnalytics(@Request() req: any) {
    return this.marketAnalyticsService.getUserAnalytics(req.user?.id || 'anonymous');
  }

  @Get('analytics/trends')
  @ApiOperation({ summary: 'Get market trends' })
  @ApiResponse({ status: 200, description: 'Market trends retrieved successfully' })
  async getMarketTrends(@Query('days') days?: number) {
    return this.marketAnalyticsService.getMarketTrends(days);
  }

  @Get('analytics/top-markets')
  @ApiOperation({ summary: 'Get top markets by volume' })
  @ApiResponse({ status: 200, description: 'Top markets retrieved successfully' })
  async getTopMarkets(@Query('limit') limit?: number) {
    return this.marketAnalyticsService.getTopMarkets(limit);
  }

  @Get('analytics/top-participants')
  @ApiOperation({ summary: 'Get top participants by winnings' })
  @ApiResponse({ status: 200, description: 'Top participants retrieved successfully' })
  async getTopParticipants(@Query('limit') limit?: number) {
    return this.marketAnalyticsService.getTopParticipants(limit);
  }

  @Get('analytics/accuracy')
  @ApiOperation({ summary: 'Get market accuracy analytics' })
  @ApiResponse({ status: 200, description: 'Accuracy analytics retrieved successfully' })
  async getMarketAccuracyAnalytics() {
    return this.marketAnalyticsService.getMarketAccuracyAnalytics();
  }

  @Post('auto-resolve')
  @ApiOperation({ summary: 'Auto-resolve token price markets' })
  @ApiResponse({ status: 200, description: 'Auto-resolution completed' })
  async autoResolveTokenPriceMarkets() {
    return this.marketResolutionService.autoResolveTokenPriceMarkets();
  }
} 