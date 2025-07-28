import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { WhaleTransaction } from "../entities/whale-transaction.entity"
import type { HeatmapDataPointDto, WhaleAnalyticsQueryDto, WhaleVolumeTrendDto } from "../dto/whale-analytics.dto"

@Injectable()
export class WhaleAnalyticsService {
  private readonly logger = new Logger(WhaleAnalyticsService.name)
  private whaleTransactionRepository: Repository<WhaleTransaction>

  constructor(whaleTransactionRepository: Repository<WhaleTransaction>) {
    this.whaleTransactionRepository = whaleTransactionRepository
  }

  async getHeatmapData(query: WhaleAnalyticsQueryDto): Promise<HeatmapDataPointDto[]> {
    this.logger.log("Generating heatmap data...")
    const queryBuilder = this.whaleTransactionRepository.createQueryBuilder("tx")
    queryBuilder.where("tx.isWhaleTransaction = :isWhale", { isWhale: true })

    if (query.blockchain) {
      queryBuilder.andWhere("tx.blockchain = :blockchain", { blockchain: query.blockchain })
    }
    if (query.blockchains && query.blockchains.length > 0) {
      queryBuilder.andWhere("tx.blockchain IN (:...blockchains)", { blockchains: query.blockchains })
    }
    if (query.assetSymbol) {
      queryBuilder.andWhere("tx.assetSymbol = :assetSymbol", { assetSymbol: query.assetSymbol })
    }
    if (query.assetSymbols && query.assetSymbols.length > 0) {
      queryBuilder.andWhere("tx.assetSymbol IN (:...assetSymbols)", { assetSymbols: query.assetSymbols })
    }
    if (query.startDate && query.endDate) {
      queryBuilder.andWhere("tx.timestamp BETWEEN :startDate AND :endDate", {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      })
    }

    // Aggregate by hour and blockchain
    const results = await queryBuilder
      .select([
        "DATE_TRUNC('hour', tx.timestamp) as timestamp",
        "tx.blockchain as blockchain",
        "SUM(tx.amountUSD) as totalWhaleVolumeUSD",
        "COUNT(tx.id) as whaleTransactionCount",
      ])
      .groupBy("DATE_TRUNC('hour', tx.timestamp)")
      .addGroupBy("tx.blockchain")
      .orderBy("timestamp", "ASC")
      .addOrderBy("blockchain", "ASC")
      .getRawMany()

    return results.map((r) => ({
      timestamp: r.timestamp.toISOString(),
      blockchain: r.blockchain,
      totalWhaleVolumeUSD: Number.parseFloat(r.totalWhaleVolumeUSD),
      whaleTransactionCount: Number.parseInt(r.whaleTransactionCount),
    }))
  }

  async getWhaleVolumeTrends(query: WhaleAnalyticsQueryDto): Promise<WhaleVolumeTrendDto[]> {
    this.logger.log("Generating whale volume trends...")
    const queryBuilder = this.whaleTransactionRepository.createQueryBuilder("tx")

    if (query.blockchain) {
      queryBuilder.andWhere("tx.blockchain = :blockchain", { blockchain: query.blockchain })
    }
    if (query.assetSymbol) {
      queryBuilder.andWhere("tx.assetSymbol = :assetSymbol", { assetSymbol: query.assetSymbol })
    }
    if (query.startDate && query.endDate) {
      queryBuilder.andWhere("tx.timestamp BETWEEN :startDate AND :endDate", {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      })
    }

    // Aggregate by day
    const results = await queryBuilder
      .select([
        "DATE_TRUNC('day', tx.timestamp) as period",
        "SUM(tx.amountUSD) as totalVolumeUSD",
        "SUM(CASE WHEN tx.isWhaleTransaction = TRUE THEN tx.amountUSD ELSE 0 END) as whaleVolumeUSD",
        "COUNT(tx.id) as transactionCount",
        "SUM(CASE WHEN tx.isWhaleTransaction = TRUE THEN 1 ELSE 0 END) as whaleTransactionCount",
      ])
      .groupBy("DATE_TRUNC('day', tx.timestamp)")
      .orderBy("period", "ASC")
      .getRawMany()

    return results.map((r) => ({
      period: r.period.toISOString().split("T")[0], // YYYY-MM-DD
      totalVolumeUSD: Number.parseFloat(r.totalVolumeUSD) || 0,
      whaleVolumeUSD: Number.parseFloat(r.whaleVolumeUSD) || 0,
      transactionCount: Number.parseInt(r.transactionCount) || 0,
      whaleTransactionCount: Number.parseInt(r.whaleTransactionCount) || 0,
    }))
  }

  async getTopWhaleTransactions(limit = 10): Promise<WhaleTransaction[]> {
    return this.whaleTransactionRepository.find({
      where: { isWhaleTransaction: true },
      order: { amountUSD: "DESC" },
      take: limit,
    })
  }
}
