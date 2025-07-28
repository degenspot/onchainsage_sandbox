import { Controller, Get, Post, Body, Param, Query, Put } from "@nestjs/common"
import type { DexPriceService } from "../services/dex-price.service"
import type { ArbitrageFinderService } from "../services/arbitrage-finder.service"
import type { ArbitrageEventService } from "../services/arbitrage-event.service"
import type { ArbitrageAlertService } from "../services/arbitrage-alert.service"
import type { ArbitrageAnalyticsService } from "../services/arbitrage-analytics.service"
import type { CreateArbitrageEventDto } from "../dto/create-arbitrage-event.dto"
import type { ArbitrageAnalyticsQueryDto } from "../dto/arbitrage-analytics.dto"
import type { ArbitrageAlertType, ArbitrageAlertSeverity } from "../entities/arbitrage-alert.entity"

@Controller("arbitrage")
export class ArbitrageController {
  constructor(
    private dexPriceService: DexPriceService,
    private arbitrageFinderService: ArbitrageFinderService,
    private arbitrageEventService: ArbitrageEventService,
    private arbitrageAlertService: ArbitrageAlertService,
    private arbitrageAnalyticsService: ArbitrageAnalyticsService,
  ) {}

  @Post("prices/fetch-mock")
  async fetchAndStoreMockPrices() {
    return this.dexPriceService.fetchAndStoreMockPrices()
  }

  @Get("prices/latest")
  async getLatestPrices(tokenSymbol?: string, chain?: string, dex?: string) {
    return this.dexPriceService.getLatestPrices(tokenSymbol, chain, dex)
  }

  @Get("prices/history")
  async getPriceHistory(tokenSymbol: string, chain: string, dex: string, limit?: number) {
    return this.dexPriceService.getPriceHistory(tokenSymbol, chain, dex, limit ? Number.parseInt(limit) : 100)
  }

  @Post("opportunities/scan")
  async scanForOpportunities(minPriceDifferencePercentage?: number, minPotentialProfitUSD?: number) {
    return this.arbitrageFinderService.scanForOpportunities(
      minPriceDifferencePercentage ? Number.parseFloat(minPriceDifferencePercentage.toString()) : undefined,
      minPotentialProfitUSD ? Number.parseFloat(minPotentialProfitUSD.toString()) : undefined,
    )
  }

  @Get("opportunities/active")
  async getActiveOpportunities() {
    return this.arbitrageFinderService.getActiveOpportunities()
  }

  @Put("opportunities/:id/inactive")
  async markOpportunityAsInactive(@Param("id") id: string) {
    return this.arbitrageFinderService.markOpportunityAsInactive(id)
  }

  @Post("events")
  async recordArbitrageEvent(@Body() createEventDto: CreateArbitrageEventDto) {
    return this.arbitrageEventService.recordArbitrageEvent(createEventDto)
  }

  @Get("events/history")
  async getHistoricalEvents(@Query() query: ArbitrageAnalyticsQueryDto) {
    return this.arbitrageEventService.getHistoricalEvents(query)
  }

  @Get("analytics/summary")
  async getProfitabilitySummary(@Query() query: ArbitrageAnalyticsQueryDto) {
    return this.arbitrageEventService.getProfitabilitySummary(query)
  }

  @Get("analytics/trends")
  async getArbitrageTrends(@Query() query: ArbitrageAnalyticsQueryDto) {
    return this.arbitrageEventService.getArbitrageTrends(query)
  }

  @Get("analytics/overall")
  async getOverallAnalytics(@Query() query: ArbitrageAnalyticsQueryDto) {
    return this.arbitrageAnalyticsService.getOverallAnalytics(query)
  }

  @Get("alerts")
  async getAlerts(type?: ArbitrageAlertType, severity?: ArbitrageAlertSeverity, isRead?: string) {
    return this.arbitrageAlertService.getAlerts(type, severity, isRead ? isRead === "true" : undefined)
  }

  @Put("alerts/:id/read")
  async markAlertAsRead(@Param("id") id: string) {
    return this.arbitrageAlertService.markAlertAsRead(id)
  }

  @Get("alerts/unread-count")
  async getUnreadAlertCount(type?: ArbitrageAlertType, severity?: ArbitrageAlertSeverity) {
    const count = await this.arbitrageAlertService.getUnreadAlertCount(type, severity)
    return { count }
  }
}
