import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { DeveloperActivityMetric } from "../entities/developer-activity-metric.entity"

@Injectable()
export class DeveloperDataService {
  private readonly logger = new Logger(DeveloperDataService.name)

  constructor(private devActivityMetricRepository: Repository<DeveloperActivityMetric>) {}

  async fetchAndSaveMockMetrics(tokenSymbol: string): Promise<DeveloperActivityMetric> {
    this.logger.debug(`Fetching and saving mock developer activity metrics for ${tokenSymbol}`)
    const newMetric = this.devActivityMetricRepository.create({
      tokenSymbol: tokenSymbol.toUpperCase(),
      commits24h: Math.floor(Math.random() * 50) + 1, // 1 to 50
      uniqueContributors24h: Math.floor(Math.random() * 10) + 1, // 1 to 10
      forks: Math.floor(Math.random() * 1000) + 10, // 10 to 1010
      stars: Math.floor(Math.random() * 5000) + 100, // 100 to 5100
      timestamp: new Date(),
    })
    return this.devActivityMetricRepository.save(newMetric)
  }

  async getLatestMetrics(tokenSymbol: string): Promise<DeveloperActivityMetric | null> {
    return this.devActivityMetricRepository.findOne({
      where: { tokenSymbol: tokenSymbol.toUpperCase() },
      order: { timestamp: "DESC" },
    })
  }

  async getHistoricalMetrics(
    tokenSymbol: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<DeveloperActivityMetric[]> {
    const query = this.devActivityMetricRepository
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
