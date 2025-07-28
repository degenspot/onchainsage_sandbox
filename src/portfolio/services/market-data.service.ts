import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import { type MarketTrend, TrendType } from "../entities/market-trend.entity"

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name)
  private marketTrendRepository: Repository<MarketTrend>

  constructor(marketTrendRepository: Repository<MarketTrend>) {
    this.marketTrendRepository = marketTrendRepository
  }

  async fetchAndStoreMockMarketTrends(): Promise<MarketTrend[]> {
    this.logger.log("Fetching and storing mock market trends...")
    const trends: MarketTrend[] = []

    const mockTrendsData = [
      {
        assetSymbol: "BTC",
        sector: "Cryptocurrency",
        trendType: TrendType.BULLISH,
        strength: 0.7,
        description: "Bitcoin showing strong upward momentum.",
      },
      {
        assetSymbol: "ETH",
        sector: "DeFi",
        trendType: TrendType.BULLISH,
        strength: 0.6,
        description: "Ethereum ecosystem growing, positive outlook.",
      },
      {
        assetSymbol: "SOL",
        sector: "Layer1",
        trendType: TrendType.NEUTRAL,
        strength: 0.1,
        description: "Solana consolidating after recent volatility.",
      },
      {
        assetSymbol: "ADA",
        sector: "Layer1",
        trendType: TrendType.BEARISH,
        strength: -0.4,
        description: "Cardano facing selling pressure.",
      },
      {
        assetSymbol: "USDC",
        sector: "Stablecoin",
        trendType: TrendType.NEUTRAL,
        strength: 0.0,
        description: "Stablecoin, no significant trend.",
      },
      {
        assetSymbol: null,
        sector: "DeFi",
        trendType: TrendType.BULLISH,
        strength: 0.8,
        description: "Overall DeFi sector showing strong growth.",
      },
      {
        assetSymbol: null,
        sector: "NFTs",
        trendType: TrendType.BEARISH,
        strength: -0.6,
        description: "NFT market experiencing a downturn.",
      },
    ]

    for (const data of mockTrendsData) {
      const trend = this.marketTrendRepository.create({
        ...data,
        timestamp: new Date(),
      })
      trends.push(await this.marketTrendRepository.save(trend))
    }
    this.logger.log(`Stored ${trends.length} mock market trends.`)
    return trends
  }

  async getLatestMarketTrend(assetSymbol?: string, sector?: string): Promise<MarketTrend | null> {
    const queryBuilder = this.marketTrendRepository.createQueryBuilder("trend")

    if (assetSymbol) {
      queryBuilder.andWhere("trend.assetSymbol = :assetSymbol", { assetSymbol })
    } else if (sector) {
      queryBuilder.andWhere("trend.sector = :sector", { sector })
    } else {
      // If neither asset nor sector, return a general market trend if available
      queryBuilder.andWhere("trend.assetSymbol IS NULL AND trend.sector IS NULL")
    }

    queryBuilder.orderBy("trend.timestamp", "DESC").limit(1)

    return queryBuilder.getOne()
  }

  async getMarketTrends(
    assetSymbol?: string,
    sector?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<MarketTrend[]> {
    const queryBuilder = this.marketTrendRepository.createQueryBuilder("trend")

    if (assetSymbol) {
      queryBuilder.andWhere("trend.assetSymbol = :assetSymbol", { assetSymbol })
    }
    if (sector) {
      queryBuilder.andWhere("trend.sector = :sector", { sector })
    }
    if (startDate && endDate) {
      queryBuilder.andWhere("trend.timestamp BETWEEN :startDate AND :endDate", { startDate, endDate })
    }

    return queryBuilder.orderBy("trend.timestamp", "DESC").getMany()
  }
}
