import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { TokenQualityScore } from "../entities/token-quality-score.entity"
import type { Token } from "../entities/token.entity"
import type { OnChainDataService } from "./on-chain-data.service"
import type { SocialDataService } from "./social-data.service"
import type { DeveloperDataService } from "./developer-data.service"
import type { TokenService } from "./token.service"
import type { TokenQualityScoreHistoryDto, TokenQualitySummaryDto } from "../dto/token-quality-score-analytics.dto"

@Injectable()
export class TokenQualityScoringService {
  private readonly logger = new Logger(TokenQualityScoringService.name)

  // Weights for each category (sum should be 1)
  private readonly ON_CHAIN_WEIGHT = 0.4
  private readonly SOCIAL_WEIGHT = 0.3
  private readonly DEV_WEIGHT = 0.3

  constructor(
    private tokenQualityScoreRepository: Repository<TokenQualityScore>,
    private tokenRepository: Repository<Token>,
    private onChainDataService: OnChainDataService,
    private socialDataService: SocialDataService,
    private developerDataService: DeveloperDataService,
    private tokenService: TokenService,
  ) {}

  async runScoringCycle(): Promise<void> {
    this.logger.log("Starting token quality scoring cycle...")
    const tokens = await this.tokenService.findAll()
    for (const token of tokens) {
      await this.calculateAndSaveCompositeScore(token.symbol)
    }
    this.logger.log("Token quality scoring cycle completed.")
  }

  async calculateAndSaveCompositeScore(tokenSymbol: string): Promise<TokenQualityScore | null> {
    this.logger.debug(`Calculating composite score for ${tokenSymbol}`)

    const onChainMetrics = await this.onChainDataService.getLatestMetrics(tokenSymbol)
    const socialMetrics = await this.socialDataService.getLatestMetrics(tokenSymbol)
    const devMetrics = await this.developerDataService.getLatestMetrics(tokenSymbol)

    if (!onChainMetrics || !socialMetrics || !devMetrics) {
      this.logger.warn(`Missing data for ${tokenSymbol}. Cannot calculate composite score.`)
      return null
    }

    // --- Sub-score Calculation (0-100 scale) ---
    let onChainScore = 0
    // Example: Volume (higher is better), Liquidity (higher is better), Holders (higher is better)
    // These thresholds are arbitrary and would be determined by data analysis in a real system
    onChainScore += Math.min(1, onChainMetrics.volume24h / 100000000) * 40 // Max 40 points for 100M volume
    onChainScore += Math.min(1, onChainMetrics.liquidity / 50000000) * 30 // Max 30 points for 50M liquidity
    onChainScore += Math.min(1, Number.parseInt(onChainMetrics.activeHolders) / 100000) * 30 // Max 30 points for 100k holders
    onChainScore = Math.min(100, Math.max(0, onChainScore)) // Cap between 0 and 100

    let socialScore = 0
    // Example: Sentiment (positive is better), Mentions (higher is better)
    socialScore += ((socialMetrics.sentimentScore + 1) / 2) * 50 // Normalize -1 to 1 to 0 to 1, then scale to 50
    socialScore += Math.min(1, socialMetrics.mentionCount / 2000) * 50 // Max 50 points for 2000 mentions
    socialScore = Math.min(100, Math.max(0, socialScore))

    let devScore = 0
    // Example: Commits (higher is better), Contributors (higher is better), Stars (higher is better)
    devScore += Math.min(1, devMetrics.commits24h / 20) * 40 // Max 40 points for 20 commits
    devScore += Math.min(1, devMetrics.uniqueContributors24h / 5) * 30 // Max 30 points for 5 contributors
    devScore += Math.min(1, devMetrics.stars / 2000) * 30 // Max 30 points for 2000 stars
    devScore = Math.min(100, Math.max(0, devScore))

    // --- Composite Score Calculation ---
    const compositeScore =
      onChainScore * this.ON_CHAIN_WEIGHT + socialScore * this.SOCIAL_WEIGHT + devScore * this.DEV_WEIGHT

    const newScore = this.tokenQualityScoreRepository.create({
      tokenSymbol: tokenSymbol.toUpperCase(),
      score: Number.parseFloat(compositeScore.toFixed(2)),
      onChainScore: Number.parseFloat(onChainScore.toFixed(2)),
      socialScore: Number.parseFloat(socialScore.toFixed(2)),
      devScore: Number.parseFloat(devScore.toFixed(2)),
      timestamp: new Date(),
    })

    await this.tokenQualityScoreRepository.save(newScore)
    await this.tokenService.update(tokenSymbol, { currentQualityScore: newScore.score })

    this.logger.log(`Calculated and saved score for ${tokenSymbol}: ${newScore.score}`)
    return newScore
  }

  async getLatestScore(tokenSymbol: string): Promise<TokenQualityScore | null> {
    return this.tokenQualityScoreRepository.findOne({
      where: { tokenSymbol: tokenSymbol.toUpperCase() },
      order: { timestamp: "DESC" },
    })
  }

  async getHistoricalScores(
    tokenSymbol: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<TokenQualityScoreHistoryDto[]> {
    const query = this.tokenQualityScoreRepository
      .createQueryBuilder("score")
      .where("score.tokenSymbol = :tokenSymbol", { tokenSymbol: tokenSymbol.toUpperCase() })
      .orderBy("score.timestamp", "ASC") // For historical trends, usually ascending

    if (startDate) {
      query.andWhere("score.timestamp >= :startDate", { startDate })
    }
    if (endDate) {
      query.andWhere("score.timestamp <= :endDate", { endDate })
    }
    if (limit) {
      query.limit(limit)
    }

    const scores = await query.getMany()
    return scores.map((s) => ({
      timestamp: s.timestamp,
      score: s.score,
      onChainScore: s.onChainScore,
      socialScore: s.socialScore,
      devScore: s.devScore,
    }))
  }

  async getTokenQualitySummary(tokenSymbol: string): Promise<TokenQualitySummaryDto | null> {
    const token = await this.tokenService.findOne(tokenSymbol).catch(() => null)
    if (!token) {
      return null
    }

    const latestScore = await this.getLatestScore(tokenSymbol)
    const latestOnChain = await this.onChainDataService.getLatestMetrics(tokenSymbol)
    const latestSocial = await this.socialDataService.getLatestMetrics(tokenSymbol)
    const latestDev = await this.developerDataService.getLatestMetrics(tokenSymbol)

    return {
      tokenSymbol: token.symbol,
      name: token.name,
      currentQualityScore: token.currentQualityScore,
      lastUpdated: latestScore?.timestamp || null,
      onChainMetrics: latestOnChain
        ? {
            volume24h: latestOnChain.volume24h,
            activeHolders: latestOnChain.activeHolders,
            liquidity: latestOnChain.liquidity,
            priceUsd: latestOnChain.priceUsd,
          }
        : undefined,
      socialSentiment: latestSocial
        ? {
            sentimentScore: latestSocial.sentimentScore,
            mentionCount: latestSocial.mentionCount,
          }
        : undefined,
      developerActivity: latestDev
        ? {
            commits24h: latestDev.commits24h,
            uniqueContributors24h: latestDev.uniqueContributors24h,
            forks: latestDev.forks,
            stars: latestDev.stars,
          }
        : undefined,
    }
  }
}
