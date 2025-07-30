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
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TournamentService } from '../services/tournament.service';
import { TournamentParticipationService } from '../services/tournament-participation.service';
import { TournamentScoringService } from '../services/tournament-scoring.service';
import { TournamentLeaderboardService } from '../services/tournament-leaderboard.service';
import { TournamentRewardService } from '../services/tournament-reward.service';
import { TournamentAnalyticsService } from '../services/tournament-analytics.service';
import { CreateTournamentDto } from '../dto/create-tournament.dto';
import { JoinTournamentDto } from '../dto/join-tournament.dto';
import { SubmitPredictionDto } from '../dto/submit-prediction.dto';
import { TournamentStatus, TournamentType, TournamentFormat } from '../entities/tournament.entity';

@ApiTags('Tournaments')
@Controller('tournaments')
export class TournamentController {
  constructor(
    private readonly tournamentService: TournamentService,
    private readonly tournamentParticipationService: TournamentParticipationService,
    private readonly tournamentScoringService: TournamentScoringService,
    private readonly tournamentLeaderboardService: TournamentLeaderboardService,
    private readonly tournamentRewardService: TournamentRewardService,
    private readonly tournamentAnalyticsService: TournamentAnalyticsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tournament' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Tournament created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid tournament data' })
  async createTournament(
    @Body() createTournamentDto: CreateTournamentDto,
    @Request() req,
  ) {
    const userId = req.user?.id || 'anonymous';
    return this.tournamentService.createTournament(createTournamentDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tournaments with optional filtering' })
  @ApiQuery({ name: 'status', enum: TournamentStatus, required: false })
  @ApiQuery({ name: 'tournamentType', enum: TournamentType, required: false })
  @ApiQuery({ name: 'format', enum: TournamentFormat, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tournaments retrieved successfully' })
  async getAllTournaments(
    @Query('status') status?: TournamentStatus,
    @Query('tournamentType') tournamentType?: TournamentType,
    @Query('format') format?: TournamentFormat,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.tournamentService.getAllTournaments(status, tournamentType, format, page, limit);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active tournaments' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Active tournaments retrieved successfully' })
  async getActiveTournaments() {
    return this.tournamentService.getActiveTournaments();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get all upcoming tournaments' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Upcoming tournaments retrieved successfully' })
  async getUpcomingTournaments() {
    return this.tournamentService.getUpcomingTournaments();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search tournaments by title or description' })
  @ApiQuery({ name: 'query', type: String, required: true })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results retrieved successfully' })
  async searchTournaments(@Query('query') query: string) {
    return this.tournamentService.searchTournaments(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tournament by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tournament retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Tournament not found' })
  async getTournamentById(@Param('id') id: string) {
    return this.tournamentService.getTournamentById(id);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get tournament analytics' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tournament analytics retrieved successfully' })
  async getTournamentAnalytics(@Param('id') id: string) {
    return this.tournamentAnalyticsService.getTournamentAnalytics(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update tournament status' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tournament status updated successfully' })
  async updateTournamentStatus(
    @Param('id') id: string,
    @Body('status') status: TournamentStatus,
  ) {
    return this.tournamentService.updateTournamentStatus(id, status);
  }

  @Post(':id/advance-round')
  @ApiOperation({ summary: 'Advance tournament to next round' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tournament advanced successfully' })
  async advanceTournamentRound(@Param('id') id: string) {
    return this.tournamentService.advanceTournamentRound(id);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a tournament' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Joined tournament successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot join tournament' })
  async joinTournament(
    @Body() joinTournamentDto: JoinTournamentDto,
    @Request() req,
  ) {
    const userId = req.user?.id || 'anonymous';
    return this.tournamentParticipationService.joinTournament(joinTournamentDto, userId);
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'Get tournament participants' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Participants retrieved successfully' })
  async getTournamentParticipants(@Param('id') id: string) {
    return this.tournamentParticipationService.getTournamentParticipants(id);
  }

  @Post('submit-prediction')
  @ApiOperation({ summary: 'Submit a prediction for a tournament' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Prediction submitted successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot submit prediction' })
  async submitPrediction(
    @Body() submitPredictionDto: SubmitPredictionDto,
    @Request() req,
  ) {
    const userId = req.user?.id || 'anonymous';
    return this.tournamentScoringService.submitPrediction(submitPredictionDto, userId);
  }

  @Get(':id/predictions')
  @ApiOperation({ summary: 'Get tournament predictions' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Predictions retrieved successfully' })
  async getTournamentPredictions(@Param('id') id: string) {
    return this.tournamentScoringService.getTournamentPredictions(id);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get tournament leaderboard' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leaderboard retrieved successfully' })
  async getTournamentLeaderboard(
    @Param('id') id: string,
    @Query('limit') limit = 50,
  ) {
    return this.tournamentLeaderboardService.getOverallLeaderboard(id, limit);
  }

  @Get(':id/leaderboard/round/:roundNumber')
  @ApiOperation({ summary: 'Get round-specific leaderboard' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'roundNumber', type: Number })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Round leaderboard retrieved successfully' })
  async getRoundLeaderboard(
    @Param('id') id: string,
    @Param('roundNumber') roundNumber: number,
    @Query('limit') limit = 50,
  ) {
    return this.tournamentLeaderboardService.getRoundLeaderboard(id, roundNumber, limit);
  }

  @Post(':id/generate-leaderboard')
  @ApiOperation({ summary: 'Generate tournament leaderboard' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leaderboard generated successfully' })
  async generateLeaderboard(@Param('id') id: string) {
    return this.tournamentLeaderboardService.generateOverallLeaderboard(id);
  }

  @Post(':id/generate-rewards')
  @ApiOperation({ summary: 'Generate tournament rewards' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rewards generated successfully' })
  async generateRewards(@Param('id') id: string) {
    return this.tournamentRewardService.generateRewards(id);
  }

  @Post(':id/distribute-rewards')
  @ApiOperation({ summary: 'Distribute tournament rewards' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rewards distributed successfully' })
  async distributeRewards(@Param('id') id: string) {
    return this.tournamentRewardService.distributeRewards(id);
  }

  @Get(':id/rewards')
  @ApiOperation({ summary: 'Get tournament rewards' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rewards retrieved successfully' })
  async getTournamentRewards(@Param('id') id: string) {
    return this.tournamentRewardService.getTournamentRewards(id);
  }

  @Get('analytics/global')
  @ApiOperation({ summary: 'Get global tournament statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Global stats retrieved successfully' })
  async getGlobalStats() {
    return this.tournamentAnalyticsService.getGlobalTournamentStats();
  }

  @Get('analytics/trends')
  @ApiOperation({ summary: 'Get tournament trends' })
  @ApiQuery({ name: 'days', type: Number, required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trends retrieved successfully' })
  async getTournamentTrends(@Query('days') days = 30) {
    return this.tournamentAnalyticsService.getTournamentTrends(days);
  }

  @Get('analytics/top-performers')
  @ApiOperation({ summary: 'Get top performers across all tournaments' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Top performers retrieved successfully' })
  async getTopPerformers(@Query('limit') limit = 10) {
    return this.tournamentAnalyticsService.getTopPerformers(limit);
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: 'Get user tournament statistics' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'User stats retrieved successfully' })
  async getUserStats(@Param('userId') userId: string) {
    return this.tournamentAnalyticsService.getUserTournamentStats(userId);
  }

  @Get('user/:userId/participations')
  @ApiOperation({ summary: 'Get user tournament participations' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'User participations retrieved successfully' })
  async getUserParticipations(@Param('userId') userId: string) {
    return this.tournamentParticipationService.getUserTournamentParticipations(userId);
  }

  @Post(':id/approve-participant/:participantId')
  @ApiOperation({ summary: 'Approve tournament participant' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'participantId', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Participant approved successfully' })
  async approveParticipant(
    @Param('id') tournamentId: string,
    @Param('participantId') participantId: string,
    @Request() req,
  ) {
    const approverId = req.user?.id || 'system';
    return this.tournamentParticipationService.approveParticipant(tournamentId, participantId, approverId);
  }

  @Post(':id/eliminate-participant/:participantId')
  @ApiOperation({ summary: 'Eliminate tournament participant' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'participantId', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Participant eliminated successfully' })
  async eliminateParticipant(
    @Param('id') tournamentId: string,
    @Param('participantId') participantId: string,
    @Body('roundNumber') roundNumber: number,
  ) {
    return this.tournamentParticipationService.eliminateParticipant(tournamentId, participantId, roundNumber);
  }

  @Post(':id/calculate-scores')
  @ApiOperation({ summary: 'Calculate scores for tournament round' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Scores calculated successfully' })
  async calculateScores(
    @Param('id') tournamentId: string,
    @Body('roundId') roundId: string,
  ) {
    await this.tournamentScoringService.calculateRoundScores(tournamentId, roundId);
    await this.tournamentScoringService.calculateTournamentRankings(tournamentId);
    return { message: 'Scores calculated successfully' };
  }
} 