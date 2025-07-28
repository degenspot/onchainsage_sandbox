import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import { type SocialSentimentMetric, SocialSource } from "../entities/social-sentiment-metric.entity"

@Injectable()
export class SocialDataService {
  private readonly logger = new Logger(SocialDataService.name)

  constructor(private socialSentimentMetricRepository: Repository<SocialSentimentMetric>) {}

  async fetchAndSaveMockMetrics(tokenSymbol: string): Promise<SocialSentimentMetric> {
    this.logger.debug(`Fetching and saving mock social sentiment metrics for ${tokenSymbol}`)
    const sources = Object.values(SocialSource)
    const randomSource = sources[Math.floor(Math.random() * sources.length)]

    const newMetric = this.socialSentimentMetricRepository.create({
      tokenSymbol: tokenSymbol.toUpperCase(),
      sentimentScore: Math.random() * 2 - 1, // -1 to 1
      mentionCount: Math.floor(Math.random() * 5000) + 100, // 100 to 5100
      source: randomSource,
      timestamp: new Date(),
    })
    return this.socialSentimentMetricRepository.save(newMetric)
  }

  async getLatestMetrics(tokenSymbol: string): Promise<SocialSentimentMetric | null> {
    return this.socialSentimentMetricRepository.findOne({
      where: { tokenSymbol: tokenSymbol.toUpperCase() },
      order: { timestamp: "DESC" },
    })
  }

  async getHistoricalMetrics(
    tokenSymbol: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<SocialSentimentMetric[]> {
    const query = this.socialSentimentMetricRepository
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
