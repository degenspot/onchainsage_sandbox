import { Injectable } from "@nestjs/common"
import type { ArbitrageFinderService } from "./arbitrage-finder.service"
import type { ArbitrageEventService } from "./arbitrage-event.service"
import type { ArbitrageAnalyticsQueryDto, TopOpportunityDto } from "../dto/arbitrage-analytics.dto"

@Injectable()
export class ArbitrageAnalyticsService {
  constructor(
    private arbitrageFinderService: ArbitrageFinderService,
    private arbitrageEventService: ArbitrageEventService,
  ) {}

  async getOverallAnalytics(query: ArbitrageAnalyticsQueryDto) {
    const [summary, trends, activeOpportunities, historicalEvents] = await Promise.all([
      this.arbitrageEventService.getProfitabilitySummary(query),
      this.arbitrageEventService.getArbitrageTrends(query),
      this.arbitrageFinderService.getActiveOpportunities(),
      this.arbitrageEventService.getHistoricalEvents(query),
    ])

    const topOpportunities: TopOpportunityDto[] = activeOpportunities
      .sort((a, b) => b.potentialProfitUSD - a.potentialProfitUSD)
      .slice(0, 10)
      .map((opp) => ({
        tokenPair: opp.tokenPair,
        chain1: opp.chain1,
        dex1: opp.dex1,
        chain2: opp.chain2,
        dex2: opp.dex2,
        priceDifferencePercentage: opp.priceDifferencePercentage,
        potentialProfitUSD: opp.potentialProfitUSD,
        detectedAt: opp.detectedAt,
      }))

    return {
      summary,
      trends,
      topOpportunities,
      historicalEvents: historicalEvents.slice(0, 50), // Limit for overview
    }
  }
}
