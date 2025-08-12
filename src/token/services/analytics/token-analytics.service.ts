import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import { InjectRepository } from "@nestjs/typeorm"
import { Token } from "../../entities/token.entity"
import { TokenAnalytics } from "../../entities/token-analytics.entity"
import { TokenTransaction } from "../../entities/token-transaction.entity"
import { TokenHolder } from "../../entities/token-holder.entity"
import { Blockchain } from "../../entities/blockchain.entity"
import type {
  TokenMetrics,
  HistoricalData,
  TokenComparison,
  ChainAnalytics,
  AnalyticsFilters,
} from "../../interfaces/analytics.interface"

@Injectable()
export class TokenAnalyticsService {
  private readonly logger = new Logger(TokenAnalyticsService.name);

  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectRepository(TokenAnalytics)
    private analyticsRepository: Repository<TokenAnalytics>,
    @InjectRepository(TokenTransaction)
    private transactionRepository: Repository<TokenTransaction>,
    @InjectRepository(TokenHolder)
    private holderRepository: Repository<TokenHolder>,
    @InjectRepository(Blockchain)
    private blockchainRepository: Repository<Blockchain>,
  ) {}

  async getTokenMetrics(tokenId: string): Promise<TokenMetrics | null> {
    try {
      const token = await this.tokenRepository.findOne({
        where: { id: tokenId },
        relations: ["blockchain", "analytics", "holders"],
      })

      if (!token) {
        return null
      }

      // Get latest analytics
      const latestAnalytics = await this.analyticsRepository.findOne({
        where: { token: { id: tokenId } },
        order: { timestamp: "DESC" },
      })

      if (!latestAnalytics) {
        return null
      }

      // Get analytics from 24h ago for comparison
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const previousAnalytics = await this.analyticsRepository.findOne({
        where: { token: { id: tokenId } },
        order: { timestamp: "DESC" },
        // This would need a more sophisticated query to find closest to 24h ago
      })

      // Calculate 24h changes
      const priceChange24h = previousAnalytics
        ? (Number.parseFloat(latestAnalytics.price) - Number.parseFloat(previousAnalytics.price)).toString()
        : "0"

      const priceChangePercentage24h =
        previousAnalytics && Number.parseFloat(previousAnalytics.price) > 0
          ? (
              ((Number.parseFloat(latestAnalytics.price) - Number.parseFloat(previousAnalytics.price)) /
                Number.parseFloat(previousAnalytics.price)) *
              100
            ).toString()
          : "0"

      const volumeChange24h = previousAnalytics
        ? (Number.parseFloat(latestAnalytics.volume24h) - Number.parseFloat(previousAnalytics.volume24h)).toString()
        : "0"

      // Get holder change
      const currentHolderCount = await this.holderRepository.count({
        where: { token: { id: tokenId } },
      })

      const holderChange24h = previousAnalytics ? currentHolderCount - previousAnalytics.holderCount : 0

      // Get transaction count for last 24h
      const transactionCount24h = await this.transactionRepository.count({
        where: {
          token: { id: tokenId },
          timestamp: { $gte: yesterday } as any,
        },
      })

      return {
        tokenId: token.id,
        symbol: token.symbol,
        name: token.name,
        chainId: token.blockchain.chainId,
        currentPrice: latestAnalytics.price,
        priceChange24h,
        priceChangePercentage24h,
        volume24h: latestAnalytics.volume24h,
        volumeChange24h,
        marketCap: latestAnalytics.marketCap,
        liquidity: latestAnalytics.liquidity,
        holderCount: currentHolderCount,
        holderChange24h,
        transactionCount24h,
        lastUpdated: latestAnalytics.createdAt,
      }
    } catch (error) {
      this.logger.error(`Failed to get token metrics for ${tokenId}:`, error)
      throw error
    }
  }

  async getHistoricalData(tokenId: string, days = 30): Promise<HistoricalData[]> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const analytics = await this.analyticsRepository.find({
        where: {
          token: { id: tokenId },
          timestamp: { $gte: startDate } as any,
        },
        order: { timestamp: "ASC" },
      })

      return analytics.map((a) => ({
        timestamp: a.timestamp,
        price: a.price,
        volume: a.volume24h,
        marketCap: a.marketCap,
        holderCount: a.holderCount,
      }))
    } catch (error) {
      this.logger.error(`Failed to get historical data for ${tokenId}:`, error)
      throw error
    }
  }

  async compareTokens(tokenAId: string, tokenBId: string): Promise<TokenComparison | null> {
    try {
      const [tokenA, tokenB] = await Promise.all([this.getTokenMetrics(tokenAId), this.getTokenMetrics(tokenBId)])

      if (!tokenA || !tokenB) {
        return null
      }

      const priceA = Number.parseFloat(tokenA.currentPrice)
      const priceB = Number.parseFloat(tokenB.currentPrice)
      const volumeA = Number.parseFloat(tokenA.volume24h)
      const volumeB = Number.parseFloat(tokenB.volume24h)
      const marketCapA = Number.parseFloat(tokenA.marketCap)
      const marketCapB = Number.parseFloat(tokenB.marketCap)

      return {
        tokenA,
        tokenB,
        priceRatio: priceB > 0 ? (priceA / priceB).toString() : "0",
        volumeRatio: volumeB > 0 ? (volumeA / volumeB).toString() : "0",
        marketCapRatio: marketCapB > 0 ? (marketCapA / marketCapB).toString() : "0",
        holderRatio: tokenB.holderCount > 0 ? (tokenA.holderCount / tokenB.holderCount).toString() : "0",
      }
    } catch (error) {
      this.logger.error(`Failed to compare tokens ${tokenAId} and ${tokenBId}:`, error)
      throw error
    }
  }

  async getChainAnalytics(chainId: string): Promise<ChainAnalytics | null> {
    try {
      const blockchain = await this.blockchainRepository.findOne({
        where: { chainId },
      })

      if (!blockchain) {
        return null
      }

      // Get all tokens for this chain
      const tokens = await this.tokenRepository.find({
        where: { blockchain: { chainId } },
        relations: ["analytics"],
      })

      if (tokens.length === 0) {
        return {
          chainId,
          chainName: blockchain.name,
          totalTokens: 0,
          totalVolume24h: "0",
          totalMarketCap: "0",
          averagePrice: "0",
          topTokens: [],
        }
      }

      // Calculate aggregated metrics
      let totalVolume = 0
      let totalMarketCap = 0
      let totalPrice = 0
      const tokenMetrics: TokenMetrics[] = []

      for (const token of tokens) {
        const metrics = await this.getTokenMetrics(token.id)
        if (metrics) {
          tokenMetrics.push(metrics)
          totalVolume += Number.parseFloat(metrics.volume24h)
          totalMarketCap += Number.parseFloat(metrics.marketCap)
          totalPrice += Number.parseFloat(metrics.currentPrice)
        }
      }

      // Sort tokens by market cap for top tokens
      const topTokens = tokenMetrics
        .sort((a, b) => Number.parseFloat(b.marketCap) - Number.parseFloat(a.marketCap))
        .slice(0, 10)

      return {
        chainId,
        chainName: blockchain.name,
        totalTokens: tokens.length,
        totalVolume24h: totalVolume.toString(),
        totalMarketCap: totalMarketCap.toString(),
        averagePrice: tokenMetrics.length > 0 ? (totalPrice / tokenMetrics.length).toString() : "0",
        topTokens,
      }
    } catch (error) {
      this.logger.error(`Failed to get chain analytics for ${chainId}:`, error)
      throw error
    }
  }

  async getFilteredTokens(filters: AnalyticsFilters): Promise<TokenMetrics[]> {
    try {
      const queryBuilder = this.tokenRepository
        .createQueryBuilder("token")
        .leftJoinAndSelect("token.blockchain", "blockchain")
        .leftJoinAndSelect("token.analytics", "analytics")

      // Apply chain filter
      if (filters.chainIds && filters.chainIds.length > 0) {
        queryBuilder.andWhere("blockchain.chainId IN (:...chainIds)", { chainIds: filters.chainIds })
      }

      // Get tokens with latest analytics
      const tokens = await queryBuilder.getMany()

      // Get metrics for each token and apply filters
      const tokenMetrics: TokenMetrics[] = []

      for (const token of tokens) {
        const metrics = await this.getTokenMetrics(token.id)
        if (!metrics) continue

        // Apply filters
        if (filters.minMarketCap && Number.parseFloat(metrics.marketCap) < Number.parseFloat(filters.minMarketCap))
          continue
        if (filters.maxMarketCap && Number.parseFloat(metrics.marketCap) > Number.parseFloat(filters.maxMarketCap))
          continue
        if (filters.minVolume24h && Number.parseFloat(metrics.volume24h) < Number.parseFloat(filters.minVolume24h))
          continue
        if (filters.maxVolume24h && Number.parseFloat(metrics.volume24h) > Number.parseFloat(filters.maxVolume24h))
          continue
        if (filters.minHolders && metrics.holderCount < filters.minHolders) continue
        if (filters.maxHolders && metrics.holderCount > filters.maxHolders) continue

        tokenMetrics.push(metrics)
      }

      // Apply sorting
      if (filters.sortBy) {
        tokenMetrics.sort((a, b) => {
          let valueA: number, valueB: number

          switch (filters.sortBy) {
            case "price":
              valueA = Number.parseFloat(a.currentPrice)
              valueB = Number.parseFloat(b.currentPrice)
              break
            case "volume":
              valueA = Number.parseFloat(a.volume24h)
              valueB = Number.parseFloat(b.volume24h)
              break
            case "marketCap":
              valueA = Number.parseFloat(a.marketCap)
              valueB = Number.parseFloat(b.marketCap)
              break
            case "holders":
              valueA = a.holderCount
              valueB = b.holderCount
              break
            case "priceChange":
              valueA = Number.parseFloat(a.priceChangePercentage24h)
              valueB = Number.parseFloat(b.priceChangePercentage24h)
              break
            default:
              return 0
          }

          return filters.sortOrder === "desc" ? valueB - valueA : valueA - valueB
        })
      }

      // Apply pagination
      const offset = filters.offset || 0
      const limit = filters.limit || 50

      return tokenMetrics.slice(offset, offset + limit)
    } catch (error) {
      this.logger.error("Failed to get filtered tokens:", error)
      throw error
    }
  }

  async getTopPerformers(chainId?: string, timeframe = "24h", limit = 10): Promise<TokenMetrics[]> {
    try {
      const filters: AnalyticsFilters = {
        chainIds: chainId ? [chainId] : undefined,
        sortBy: "priceChange",
        sortOrder: "desc",
        limit,
      }

      return this.getFilteredTokens(filters)
    } catch (error) {
      this.logger.error("Failed to get top performers:", error)
      throw error
    }
  }

  async getTopLosers(chainId?: string, timeframe = "24h", limit = 10): Promise<TokenMetrics[]> {
    try {
      const filters: AnalyticsFilters = {
        chainIds: chainId ? [chainId] : undefined,
        sortBy: "priceChange",
        sortOrder: "asc",
        limit,
      }

      return this.getFilteredTokens(filters)
    } catch (error) {
      this.logger.error("Failed to get top losers:", error)
      throw error
    }
  }

  async getMostActiveTokens(chainId?: string, limit = 10): Promise<TokenMetrics[]> {
    try {
      const filters: AnalyticsFilters = {
        chainIds: chainId ? [chainId] : undefined,
        sortBy: "volume",
        sortOrder: "desc",
        limit,
      }

      return this.getFilteredTokens(filters)
    } catch (error) {
      this.logger.error("Failed to get most active tokens:", error)
      throw error
    }
  }
}
