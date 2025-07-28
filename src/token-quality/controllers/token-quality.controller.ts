import { Controller, Get, Post, Query, Param, HttpCode, HttpStatus } from "@nestjs/common"
import type { TokenService } from "../services/token.service"
import type { TokenQualityScoringService } from "../services/token-quality-scoring.service"
import type { OnChainDataService } from "../services/on-chain-data.service"
import type { SocialDataService } from "../services/social-data.service"
import type { DeveloperDataService } from "../services/developer-data.service"
import type { CreateTokenDto } from "../dto/create-token.dto"
import type { TokenQualityScoreQueryDto } from "../dto/token-quality-score-query.dto"

@Controller("token-quality")
export class TokenQualityController {
  constructor(
    private tokenService: TokenService,
    private tokenQualityScoringService: TokenQualityScoringService,
    private onChainDataService: OnChainDataService,
    private socialDataService: SocialDataService,
    private developerDataService: DeveloperDataService,
  ) {}

  // --- Token Management ---
  @Post("tokens")
  @HttpCode(HttpStatus.CREATED)
  async createToken(createTokenDto: CreateTokenDto) {
    return this.tokenService.create(createTokenDto)
  }

  @Get("tokens")
  async getAllTokens() {
    return this.tokenService.findAll()
  }

  // --- Scoring Cycle & Data Ingestion ---
  @Post("run-scoring-cycle")
  @HttpCode(HttpStatus.OK)
  async runScoringCycle() {
    await this.tokenQualityScoringService.runScoringCycle()
    return { message: "Token quality scoring cycle initiated." }
  }

  @Post("tokens/:symbol/ingest-mock-data")
  @HttpCode(HttpStatus.CREATED)
  async ingestMockDataForToken(@Param("symbol") symbol: string) {
    await this.onChainDataService.fetchAndSaveMockMetrics(symbol)
    await this.socialDataService.fetchAndSaveMockMetrics(symbol)
    await this.developerDataService.fetchAndSaveMockMetrics(symbol)
    return { message: `Mock data ingested for ${symbol}.` }
  }

  // --- Quality Score Endpoints ---
  @Get("scores/:symbol/latest")
  async getLatestTokenQualityScore(@Param("symbol") symbol: string) {
    return this.tokenQualityScoringService.getLatestScore(symbol)
  }

  @Get("scores/:symbol/history")
  async getHistoricalTokenQualityScores(@Param("symbol") symbol: string, @Query() query: TokenQualityScoreQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined
    const endDate = query.endDate ? new Date(query.endDate) : undefined
    const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined
    return this.tokenQualityScoringService.getHistoricalScores(symbol, startDate, endDate, limit)
  }

  @Get("scores/:symbol/summary")
  async getTokenQualitySummary(@Param("symbol") symbol: string) {
    return this.tokenQualityScoringService.getTokenQualitySummary(symbol)
  }

  // --- Raw Metric Data Access (for debugging/advanced analytics) ---
  @Get("metrics/:symbol/on-chain")
  async getOnChainMetrics(@Param("symbol") symbol: string, @Query() query: TokenQualityScoreQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined
    const endDate = query.endDate ? new Date(query.endDate) : undefined
    const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined
    return this.onChainDataService.getHistoricalMetrics(symbol, startDate, endDate, limit)
  }

  @Get("metrics/:symbol/social")
  async getSocialMetrics(@Param("symbol") symbol: string, @Query() query: TokenQualityScoreQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined
    const endDate = query.endDate ? new Date(query.endDate) : undefined
    const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined
    return this.socialDataService.getHistoricalMetrics(symbol, startDate, endDate, limit)
  }

  @Get("metrics/:symbol/developer")
  async getDeveloperMetrics(@Param("symbol") symbol: string, @Query() query: TokenQualityScoreQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined
    const endDate = query.endDate ? new Date(query.endDate) : undefined
    const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined
    return this.developerDataService.getHistoricalMetrics(symbol, startDate, endDate, limit)
  }
}
