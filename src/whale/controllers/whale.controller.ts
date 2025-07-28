import { Controller, Get, Post, Body, Query, Param, Put } from "@nestjs/common"
import type { BlockchainMonitorService } from "../services/blockchain-monitor.service"
import type { WhaleTransactionService } from "../services/whale-transaction.service"
import type { WhaleAlertService } from "../services/whale-alert.service"
import type { WhaleAnalyticsService } from "../services/whale-analytics.service"
import type {
  WhaleAnalyticsQueryDto,
  WhaleAlertQueryDto,
  HeatmapDataPointDto,
  WhaleVolumeTrendDto,
  TopWhaleTransactionDto,
} from "../dto/whale-analytics.dto"
import type { BlockchainProtocol } from "../entities/blockchain-node.entity"

@Controller("whale")
export class WhaleController {
  constructor(
    private blockchainMonitorService: BlockchainMonitorService,
    private whaleTransactionService: WhaleTransactionService,
    private whaleAlertService: WhaleAlertService,
    private whaleAnalyticsService: WhaleAnalyticsService,
  ) {}

  // --- Blockchain Monitoring ---
  @Post("nodes")
  async createBlockchainNode(
    @Body() body: { name: string; blockchain: BlockchainProtocol; apiUrl: string; apiKey?: string },
  ) {
    const { name, blockchain, apiUrl, apiKey } = body
    return this.blockchainMonitorService.createNode(name, blockchain, apiUrl, apiKey)
  }

  @Get("nodes")
  async getMonitoredNodes() {
    return this.blockchainMonitorService.getMonitoredNodes()
  }

  @Post("transactions/fetch-mock")
  async fetchAndProcessMockTransactions(
    @Query("blockchain") blockchain: BlockchainProtocol,
    @Query("fromBlock") fromBlock: number = 0,
    @Query("toBlock") toBlock: number = 1000000,
  ) {
    const rawTxs = await this.blockchainMonitorService.fetchRawTransactions(blockchain, fromBlock, toBlock)
    const processedTxs = []
    for (const tx of rawTxs) {
      processedTxs.push(await this.whaleTransactionService.processAndSaveTransaction(tx))
    }
    return processedTxs
  }

  // --- Whale Transactions ---
  @Get("transactions")
  async getWhaleTransactions(@Query() query: WhaleAnalyticsQueryDto) {
    return this.whaleTransactionService.findAllWhaleTransactions(query)
  }

  @Get("transactions/count")
  async getWhaleTransactionCount(@Query() query: WhaleAnalyticsQueryDto) {
    const count = await this.whaleTransactionService.getWhaleTransactionCount(query)
    return { count }
  }

  // --- Whale Alerts ---
  @Get("alerts")
  async getWhaleAlerts(@Query() query: WhaleAlertQueryDto) {
    return this.whaleAlertService.getAlerts(query)
  }

  @Put("alerts/:id/read")
  async markAlertAsRead(@Param("id") id: string) {
    return this.whaleAlertService.markAlertAsRead(id)
  }

  @Get("alerts/unread-count")
  async getUnreadAlertCount(@Query() query: WhaleAlertQueryDto) {
    const count = await this.whaleAlertService.getUnreadAlertCount(query)
    return { count }
  }

  // --- Analytics & Heatmap Data ---
  @Get("analytics/heatmap")
  async getHeatmapData(@Query() query: WhaleAnalyticsQueryDto): Promise<HeatmapDataPointDto[]> {
    return this.whaleAnalyticsService.getHeatmapData(query)
  }

  @Get("analytics/volume-trends")
  async getWhaleVolumeTrends(@Query() query: WhaleAnalyticsQueryDto): Promise<WhaleVolumeTrendDto[]> {
    return this.whaleAnalyticsService.getWhaleVolumeTrends(query)
  }

  @Get("analytics/top-transactions")
  async getTopWhaleTransactions(@Query("limit") limit?: number): Promise<TopWhaleTransactionDto[]> {
    return this.whaleAnalyticsService.getTopWhaleTransactions(limit ? Number.parseInt(limit) : 10)
  }
}
