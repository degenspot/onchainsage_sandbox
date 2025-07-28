import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { ArbitrageEvent } from "../entities/arbitrage-event.entity"
import type { CreateArbitrageEventDto } from "../dto/create-arbitrage-event.dto"
import type {
  ArbitrageAnalyticsQueryDto,
  ProfitabilitySummaryDto,
  ArbitrageTrendDto,
} from "../dto/arbitrage-analytics.dto"

@Injectable()
export class ArbitrageEventService {
  private readonly logger = new Logger(ArbitrageEventService.name)
  private arbitrageEventRepository: Repository<ArbitrageEvent>

  constructor(arbitrageEventRepository: Repository<ArbitrageEvent>) {
    this.arbitrageEventRepository = arbitrageEventRepository
  }

  async recordArbitrageEvent(createEventDto: CreateArbitrageEventDto): Promise<ArbitrageEvent> {
    const event = this.arbitrageEventRepository.create(createEventDto)
    this.logger.log(`Recording arbitrage event for ${event.tokenPair} with profit ${event.executedProfitUSD}`)
    return this.arbitrageEventRepository.save(event)
  }

  async getHistoricalEvents(query: ArbitrageAnalyticsQueryDto): Promise<ArbitrageEvent[]> {
    const queryBuilder = this.arbitrageEventRepository.createQueryBuilder("event")

    if (query.tokenPair) {
      queryBuilder.andWhere("event.tokenPair = :tokenPair", { tokenPair: query.tokenPair })
    }
    if (query.chain) {
      queryBuilder.andWhere("(event.chain1 = :chain OR event.chain2 = :chain)", { chain: query.chain })
    }
    if (query.dex) {
      queryBuilder.andWhere("(event.dex1 = :dex OR event.dex2 = :dex)", { dex: query.dex })
    }
    if (query.startDate && query.endDate) {
      queryBuilder.andWhere("event.executedAt BETWEEN :startDate AND :endDate", {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      })
    }
    if (query.minProfitUSD) {
      queryBuilder.andWhere("event.executedProfitUSD >= :minProfitUSD", { minProfitUSD: query.minProfitUSD })
    }
    if (query.tokenPairs && query.tokenPairs.length > 0) {
      queryBuilder.andWhere("event.tokenPair IN (:...tokenPairs)", { tokenPairs: query.tokenPairs })
    }
    if (query.chains && query.chains.length > 0) {
      queryBuilder.andWhere("(event.chain1 IN (:...chains) OR event.chain2 IN (:...chains))", {
        chains: query.chains,
      })
    }

    return queryBuilder.orderBy("event.executedAt", "DESC").getMany()
  }

  async getProfitabilitySummary(query: ArbitrageAnalyticsQueryDto): Promise<ProfitabilitySummaryDto> {
    const events = await this.getHistoricalEvents(query)

    const totalOpportunitiesDetected = await this.arbitrageEventRepository.count() // This should ideally come from opportunity service
    const totalEventsRecorded = events.length
    const totalProfitUSD = events.reduce((sum, event) => sum + Number(event.executedProfitUSD), 0)
    const averageProfitPerEventUSD = totalEventsRecorded > 0 ? totalProfitUSD / totalEventsRecorded : 0
    const highestProfitEventUSD = events.length > 0 ? Math.max(...events.map((e) => Number(e.executedProfitUSD))) : 0

    const tokenPairCounts = new Map<string, number>()
    const chainCounts = new Map<string, number>()
    let mostProfitablePair = "N/A"
    let mostProfitableChain = "N/A"
    let maxPairProfit = 0
    let maxChainProfit = 0

    for (const event of events) {
      tokenPairCounts.set(
        event.tokenPair,
        (tokenPairCounts.get(event.tokenPair) || 0) + Number(event.executedProfitUSD),
      )
      if (tokenPairCounts.get(event.tokenPair) > maxPairProfit) {
        maxPairProfit = tokenPairCounts.get(event.tokenPair)
        mostProfitablePair = event.tokenPair
      }

      chainCounts.set(event.chain1, (chainCounts.get(event.chain1) || 0) + Number(event.executedProfitUSD))
      chainCounts.set(event.chain2, (chainCounts.get(event.chain2) || 0) + Number(event.executedProfitUSD))
      if (chainCounts.get(event.chain1) > maxChainProfit) {
        maxChainProfit = chainCounts.get(event.chain1)
        mostProfitableChain = event.chain1
      }
      if (chainCounts.get(event.chain2) > maxChainProfit) {
        maxChainProfit = chainCounts.get(event.chain2)
        mostProfitableChain = event.chain2
      }
    }

    return {
      totalOpportunitiesDetected,
      totalEventsRecorded,
      totalProfitUSD,
      averageProfitPerEventUSD,
      highestProfitEventUSD,
      mostProfitablePair,
      mostProfitableChain,
    }
  }

  async getArbitrageTrends(query: ArbitrageAnalyticsQueryDto): Promise<ArbitrageTrendDto[]> {
    const queryBuilder = this.arbitrageEventRepository.createQueryBuilder("event")

    if (query.tokenPairs && query.tokenPairs.length > 0) {
      queryBuilder.andWhere("event.tokenPair IN (:...tokenPairs)", { tokenPairs: query.tokenPairs })
    }
    if (query.chains && query.chains.length > 0) {
      queryBuilder.andWhere("(event.chain1 IN (:...chains) OR event.chain2 IN (:...chains))", {
        chains: query.chains,
      })
    }
    if (query.startDate && query.endDate) {
      queryBuilder.andWhere("event.executedAt BETWEEN :startDate AND :endDate", {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      })
    }

    const results = await queryBuilder
      .select([
        "DATE_TRUNC('day', event.executedAt) as period", // Group by day
        "COUNT(*) as executedEventsCount",
        "SUM(event.executedProfitUSD) as totalProfitUSD",
      ])
      .groupBy("DATE_TRUNC('day', event.executedAt)")
      .orderBy("period", "ASC")
      .getRawMany()

    return results.map((result) => ({
      period: result.period.toISOString().split("T")[0], // Format to YYYY-MM-DD
      opportunitiesCount: 0, // This would require joining with opportunities or separate query
      executedEventsCount: Number.parseInt(result.executedEventsCount),
      totalProfitUSD: Number.parseFloat(result.totalProfitUSD) || 0,
      averageProfitUSD: Number.parseFloat(result.totalProfitUSD) / Number.parseInt(result.executedEventsCount) || 0,
    }))
  }
}
