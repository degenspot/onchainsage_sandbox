import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { OnChainMetric } from "../entities/on-chain-metric.entity"

@Injectable()
export class OnChainDataService {
  private readonly logger = new Logger(OnChainDataService.name)

  constructor(private onChainMetricRepository: Repository<OnChainMetric>) {}

  async fetchAndSaveMockMetrics(tokenSymbol: string): Promise<OnChainMetric> {
    this.logger.debug(`Fetching and saving mock on-chain metrics for ${tokenSymbol}`)
    const newMetric = this.onChainMetricRepository.create({
      tokenSymbol: tokenSymbol.toUpperCase(),
      volume24h: Math.random() * 1000000000 + 1000000, // 1M to 1B
      activeHolders: (Math.floor(Math.random() * 1000000) + 10000).toString(), // 10k to 1M
      liquidity: Math.random() * 500000000 + 500000, // 0.5M to 500M
      priceUsd: Math.random() * 50000 + 1, // 1 to 50k
      timestamp: new Date(),
    })
    return this.onChainMetricRepository.save(newMetric)
  }

  async getLatestMetrics(tokenSymbol: string): Promise<OnChainMetric | null> {
    return this.onChainMetricRepository.findOne({
      where: { tokenSymbol: tokenSymbol.toUpperCase() },
      order: { timestamp: "DESC" },
    })
  }

  async getHistoricalMetrics(
    tokenSymbol: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<OnChainMetric[]> {
    const query = this.onChainMetricRepository
      .createQueryBuilder("metric")
      .where("metric.tokenSymbol = :tokenSymbol", { tokenSymbol: tokenSymbol.toUpperCase() })
      .orderBy("metric.timestamp", "DESC")

    if (startDate) {
      query.andWhere("metric.timestamp >= :startDate", { startDate })
    }
    if (endDate) {
      query.andWhere("metric.timestamp <= :endDate", { endDate })
    }
    if (limit) {
      query.limit(limit)
    }

    return query.getMany()
  }
}
