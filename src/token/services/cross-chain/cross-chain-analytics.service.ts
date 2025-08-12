import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { Token } from "../../entities/token.entity"
import type { TokenAnalytics } from "../../entities/token-analytics.entity"
import type { Blockchain } from "../../entities/blockchain.entity"
import type { TokenAnalyticsService } from "../analytics/token-analytics.service"
import type {
  CrossChainTokenData,
  CrossChainComparison,
  CrossChainPortfolio,
  CrossChainArbitrage,
  CrossChainMarketData,
} from "../../interfaces/cross-chain.interface"

@Injectable()
export class CrossChainAnalyticsService {
  private readonly logger = new Logger(CrossChainAnalyticsService.name)

  constructor(
    private tokenRepository: Repository<Token>,
    private analyticsRepository: Repository<TokenAnalytics>,
    private blockchainRepository: Repository<Blockchain>,
    private tokenAnalyticsService: TokenAnalyticsService,
  ) {}

  async getCrossChainTokenData(symbol: string): Promise<CrossChainTokenData[]> {
    try {
      // Find all tokens with the same symbol across different chains
      const tokens = await this.tokenRepository.find({
        where: { symbol: symbol.toUpperCase(), isActive: true },
        relations: ["blockchain"],
      })

      const crossChainData: CrossChainTokenData[] = []

      for (const token of tokens) {
        const metrics = await this.tokenAnalyticsService.getTokenMetrics(token.id)
        if (metrics) {
          crossChainData.push({
            tokenId: token.id,
            symbol: token.symbol,
            name: token.name,
            chainId: token.blockchain.chainId,
            chainName: token.blockchain.name,
            contractAddress: token.contractAddress,
            price: metrics.currentPrice,
            marketCap: metrics.marketCap,
            volume24h: metrics.volume24h,
            liquidity: metrics.liquidity,
            holderCount: metrics.holderCount,
            priceChange24h: metrics.priceChangePercentage24h,
          })
        }
      }

      return crossChainData
    } catch (error) {
      this.logger.error(`Failed to get cross-chain data for ${symbol}:`, error)
      throw error
    }
  }

  async compareCrossChainToken(symbol: string): Promise<CrossChainComparison | null> {
    try {
      const tokens = await this.getCrossChainTokenData(symbol)

      if (tokens.length === 0) {
        return null
      }

      // Calculate aggregated metrics
      const totalMarketCap = tokens.reduce((sum, token) => sum + Number.parseFloat(token.marketCap), 0)
      const totalVolume24h = tokens.reduce((sum, token) => sum + Number.parseFloat(token.volume24h), 0)
      const totalLiquidity = tokens.reduce((sum, token) => sum + Number.parseFloat(token.liquidity), 0)
      const totalHolders = tokens.reduce((sum, token) => sum + token.holderCount, 0)
      const averagePrice = tokens.reduce((sum, token) => sum + Number.parseFloat(token.price), 0) / tokens.length

      // Find price spread
      const sortedByPrice = [...tokens].sort((a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price))
      const minPrice = sortedByPrice[0]
      const maxPrice = sortedByPrice[sortedByPrice.length - 1]
      const spreadPercentage =
        Number.parseFloat(minPrice.price) > 0
          ? (
              ((Number.parseFloat(maxPrice.price) - Number.parseFloat(minPrice.price)) /
                Number.parseFloat(minPrice.price)) *
              100
            ).toString()
          : "0"

      // Calculate volume distribution
      const volumeDistribution = tokens.map((token) => ({
        chainId: token.chainId,
        chainName: token.chainName,
        volume: token.volume24h,
        percentage: totalVolume24h > 0 ? ((Number.parseFloat(token.volume24h) / totalVolume24h) * 100).toString() : "0",
      }))

      return {
        symbol,
        tokens,
        totalMarketCap: totalMarketCap.toString(),
        totalVolume24h: totalVolume24h.toString(),
        totalLiquidity: totalLiquidity.toString(),
        totalHolders,
        averagePrice: averagePrice.toString(),
        priceSpread: {
          min: minPrice,
          max: maxPrice,
          spreadPercentage,
        },
        volumeDistribution,
      }
    } catch (error) {
      this.logger.error(`Failed to compare cross-chain token ${symbol}:`, error)
      throw error
    }
  }

  async getCrossChainPortfolio(tokenIds: string[]): Promise<CrossChainPortfolio> {
    try {
      const tokens: CrossChainTokenData[] = []
      let totalValue = 0

      // Get data for each token
      for (const tokenId of tokenIds) {
        const token = await this.tokenRepository.findOne({
          where: { id: tokenId },
          relations: ["blockchain"],
        })

        if (!token) continue

        const metrics = await this.tokenAnalyticsService.getTokenMetrics(tokenId)
        if (metrics) {
          const tokenData: CrossChainTokenData = {
            tokenId: token.id,
            symbol: token.symbol,
            name: token.name,
            chainId: token.blockchain.chainId,
            chainName: token.blockchain.name,
            contractAddress: token.contractAddress,
            price: metrics.currentPrice,
            marketCap: metrics.marketCap,
            volume24h: metrics.volume24h,
            liquidity: metrics.liquidity,
            holderCount: metrics.holderCount,
            priceChange24h: metrics.priceChangePercentage24h,
          }

          tokens.push(tokenData)
          totalValue += Number.parseFloat(tokenData.marketCap)
        }
      }

      // Calculate chain distribution
      const chainMap = new Map<string, { value: number; count: number; name: string }>()

      for (const token of tokens) {
        const existing = chainMap.get(token.chainId) || { value: 0, count: 0, name: token.chainName }
        existing.value += Number.parseFloat(token.marketCap)
        existing.count += 1
        existing.name = token.chainName
        chainMap.set(token.chainId, existing)
      }

      const chainDistribution = Array.from(chainMap.entries()).map(([chainId, data]) => ({
        chainId,
        chainName: data.name,
        value: data.value.toString(),
        percentage: totalValue > 0 ? ((data.value / totalValue) * 100).toString() : "0",
        tokenCount: data.count,
      }))

      // Calculate performance metrics
      const returns24h = tokens.map((token) => Number.parseFloat(token.priceChange24h))
      const totalReturn24h = returns24h.reduce((sum, ret) => sum + ret, 0)
      const totalReturnPercentage24h = returns24h.length > 0 ? (totalReturn24h / returns24h.length).toString() : "0"

      const sortedByPerformance = [...tokens].sort(
        (a, b) => Number.parseFloat(b.priceChange24h) - Number.parseFloat(a.priceChange24h),
      )

      return {
        totalValue: totalValue.toString(),
        chainDistribution,
        topTokens: tokens.slice(0, 10),
        performanceMetrics: {
          totalReturn24h: totalReturn24h.toString(),
          totalReturnPercentage24h,
          bestPerformer: sortedByPerformance[0],
          worstPerformer: sortedByPerformance[sortedByPerformance.length - 1],
        },
      }
    } catch (error) {
      this.logger.error("Failed to get cross-chain portfolio:", error)
      throw error
    }
  }

  async findArbitrageOpportunities(symbol: string, minProfitPercentage = 1): Promise<CrossChainArbitrage | null> {
    try {
      const tokens = await this.getCrossChainTokenData(symbol)

      if (tokens.length < 2) {
        return null
      }

      const opportunities: CrossChainArbitrage["opportunities"] = []

      // Compare all pairs of tokens
      for (let i = 0; i < tokens.length; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
          const tokenA = tokens[i]
          const tokenB = tokens[j]

          const priceA = Number.parseFloat(tokenA.price)
          const priceB = Number.parseFloat(tokenB.price)

          if (priceA === 0 || priceB === 0) continue

          let buyToken: CrossChainTokenData
          let sellToken: CrossChainTokenData
          let profitPercentage: number

          if (priceA < priceB) {
            buyToken = tokenA
            sellToken = tokenB
            profitPercentage = ((priceB - priceA) / priceA) * 100
          } else {
            buyToken = tokenB
            sellToken = tokenA
            profitPercentage = ((priceA - priceB) / priceB) * 100
          }

          if (profitPercentage >= minProfitPercentage) {
            // Calculate liquidity score (simplified)
            const liquidityScore = Math.min(
              Number.parseFloat(buyToken.liquidity),
              Number.parseFloat(sellToken.liquidity),
            )

            opportunities.push({
              buyChain: buyToken,
              sellChain: sellToken,
              profitPercentage: profitPercentage.toString(),
              profitUsd: (liquidityScore * (profitPercentage / 100)).toString(),
              liquidityScore:
                liquidityScore > 1000000 ? 10 : liquidityScore > 100000 ? 7 : liquidityScore > 10000 ? 5 : 3,
            })
          }
        }
      }

      // Sort by profit percentage
      opportunities.sort((a, b) => Number.parseFloat(b.profitPercentage) - Number.parseFloat(a.profitPercentage))

      return {
        symbol,
        opportunities: opportunities.slice(0, 10), // Top 10 opportunities
      }
    } catch (error) {
      this.logger.error(`Failed to find arbitrage opportunities for ${symbol}:`, error)
      throw error
    }
  }

  async getCrossChainMarketData(): Promise<CrossChainMarketData> {
    try {
      const blockchains = await this.blockchainRepository.find({
        where: { isActive: true },
      })

      let totalMarketCap = 0
      let totalVolume24h = 0
      const chainMetrics: CrossChainMarketData["chainMetrics"] = []
      const allTokens: CrossChainTokenData[] = []

      for (const blockchain of blockchains) {
        const tokens = await this.tokenRepository.find({
          where: { blockchain: { id: blockchain.id }, isActive: true },
          relations: ["blockchain"],
        })

        let chainMarketCap = 0
        let chainVolume24h = 0

        for (const token of tokens) {
          const metrics = await this.tokenAnalyticsService.getTokenMetrics(token.id)
          if (metrics) {
            const marketCap = Number.parseFloat(metrics.marketCap)
            const volume = Number.parseFloat(metrics.volume24h)

            chainMarketCap += marketCap
            chainVolume24h += volume

            allTokens.push({
              tokenId: token.id,
              symbol: token.symbol,
              name: token.name,
              chainId: blockchain.chainId,
              chainName: blockchain.name,
              contractAddress: token.contractAddress,
              price: metrics.currentPrice,
              marketCap: metrics.marketCap,
              volume24h: metrics.volume24h,
              liquidity: metrics.liquidity,
              holderCount: metrics.holderCount,
              priceChange24h: metrics.priceChangePercentage24h,
            })
          }
        }

        totalMarketCap += chainMarketCap
        totalVolume24h += chainVolume24h

        chainMetrics.push({
          chainId: blockchain.chainId,
          chainName: blockchain.name,
          marketCap: chainMarketCap.toString(),
          volume24h: chainVolume24h.toString(),
          tokenCount: tokens.length,
          dominancePercentage: "0", // Will be calculated after total is known
        })
      }

      // Calculate dominance percentages
      chainMetrics.forEach((chain) => {
        chain.dominancePercentage =
          totalMarketCap > 0 ? ((Number.parseFloat(chain.marketCap) / totalMarketCap) * 100).toString() : "0"
      })

      // Get top cross-chain tokens by market cap
      const topCrossChainTokens = allTokens
        .sort((a, b) => Number.parseFloat(b.marketCap) - Number.parseFloat(a.marketCap))
        .slice(0, 20)

      return {
        totalMarketCap: totalMarketCap.toString(),
        totalVolume24h: totalVolume24h.toString(),
        chainMetrics: chainMetrics.sort((a, b) => Number.parseFloat(b.marketCap) - Number.parseFloat(a.marketCap)),
        topCrossChainTokens,
      }
    } catch (error) {
      this.logger.error("Failed to get cross-chain market data:", error)
      throw error
    }
  }

  async getChainDominance(): Promise<{ chainId: string; chainName: string; dominancePercentage: string }[]> {
    try {
      const marketData = await this.getCrossChainMarketData()
      return marketData.chainMetrics.map((chain) => ({
        chainId: chain.chainId,
        chainName: chain.chainName,
        dominancePercentage: chain.dominancePercentage,
      }))
    } catch (error) {
      this.logger.error("Failed to get chain dominance:", error)
      throw error
    }
  }
}
