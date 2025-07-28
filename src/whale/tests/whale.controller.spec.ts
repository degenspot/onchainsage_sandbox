import { Test, type TestingModule } from "@nestjs/testing"
import { WhaleController } from "../controllers/whale.controller"
import { BlockchainMonitorService } from "../services/blockchain-monitor.service"
import { WhaleTransactionService } from "../services/whale-transaction.service"
import { WhaleAlertService } from "../services/whale-alert.service"
import { WhaleAnalyticsService } from "../services/whale-analytics.service"
import { BlockchainProtocol } from "../entities/blockchain-node.entity"
import { WhaleAlertType, WhaleAlertSeverity } from "../entities/whale-alert.entity"
import { jest } from "@jest/globals"

describe("WhaleController", () => {
  let controller: WhaleController
  let blockchainMonitorService: BlockchainMonitorService
  let whaleTransactionService: WhaleTransactionService
  let whaleAlertService: WhaleAlertService
  let whaleAnalyticsService: WhaleAnalyticsService

  const mockBlockchainMonitorService = {
    createNode: jest.fn(),
    getMonitoredNodes: jest.fn(),
    fetchRawTransactions: jest.fn(),
  }

  const mockWhaleTransactionService = {
    processAndSaveTransaction: jest.fn(),
    findAllWhaleTransactions: jest.fn(),
    getWhaleTransactionCount: jest.fn(),
  }

  const mockWhaleAlertService = {
    getAlerts: jest.fn(),
    markAlertAsRead: jest.fn(),
    getUnreadAlertCount: jest.fn(),
  }

  const mockWhaleAnalyticsService = {
    getHeatmapData: jest.fn(),
    getWhaleVolumeTrends: jest.fn(),
    getTopWhaleTransactions: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhaleController],
      providers: [
        { provide: BlockchainMonitorService, useValue: mockBlockchainMonitorService },
        { provide: WhaleTransactionService, useValue: mockWhaleTransactionService },
        { provide: WhaleAlertService, useValue: mockWhaleAlertService },
        { provide: WhaleAnalyticsService, useValue: mockWhaleAnalyticsService },
      ],
    }).compile()

    controller = module.get<WhaleController>(WhaleController)
    blockchainMonitorService = module.get<BlockchainMonitorService>(BlockchainMonitorService)
    whaleTransactionService = module.get<WhaleTransactionService>(WhaleTransactionService)
    whaleAlertService = module.get<WhaleAlertService>(WhaleAlertService)
    whaleAnalyticsService = module.get<WhaleAnalyticsService>(WhaleAnalyticsService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("createBlockchainNode", () => {
    it("should create a new blockchain node", async () => {
      const nodeData = {
        name: "Test Node",
        blockchain: BlockchainProtocol.ETHEREUM,
        apiUrl: "http://test.api",
        apiKey: "testkey",
      }
      mockBlockchainMonitorService.createNode.mockResolvedValue({ id: "node1", ...nodeData })
      expect(
        await controller.createBlockchainNode(nodeData.name, nodeData.blockchain, nodeData.apiUrl, nodeData.apiKey),
      ).toEqual({
        id: "node1",
        ...nodeData,
      })
      expect(blockchainMonitorService.createNode).toHaveBeenCalledWith(
        nodeData.name,
        nodeData.blockchain,
        nodeData.apiUrl,
        nodeData.apiKey,
      )
    })
  })

  describe("getMonitoredNodes", () => {
    it("should return a list of monitored nodes", async () => {
      const nodes = [{ id: "node1", name: "Eth Node" }]
      mockBlockchainMonitorService.getMonitoredNodes.mockResolvedValue(nodes)
      expect(await controller.getMonitoredNodes()).toEqual(nodes)
      expect(blockchainMonitorService.getMonitoredNodes).toHaveBeenCalled()
    })
  })

  describe("fetchAndProcessMockTransactions", () => {
    it("should fetch and process mock transactions", async () => {
      const mockRawTxs = [
        {
          transactionHash: "tx1",
          blockchain: BlockchainProtocol.ETHEREUM,
          amountUSD: 1000000,
          timestamp: new Date().toISOString(),
        },
      ] as any
      const processedTx = { id: "tx_id_1", transactionHash: "tx1", isWhaleTransaction: true } as any

      mockBlockchainMonitorService.fetchRawTransactions.mockResolvedValue(mockRawTxs)
      mockWhaleTransactionService.processAndSaveTransaction.mockResolvedValue(processedTx)

      const result = await controller.fetchAndProcessMockTransactions(BlockchainProtocol.ETHEREUM, 0, 100)

      expect(blockchainMonitorService.fetchRawTransactions).toHaveBeenCalledWith(BlockchainProtocol.ETHEREUM, 0, 100)
      expect(whaleTransactionService.processAndSaveTransaction).toHaveBeenCalledWith(mockRawTxs[0])
      expect(result).toEqual([processedTx])
    })
  })

  describe("getWhaleTransactions", () => {
    it("should return whale transactions based on query", async () => {
      const query = { blockchain: "ethereum" }
      const transactions = [{ id: "tx1", blockchain: "ethereum", isWhaleTransaction: true }]
      mockWhaleTransactionService.findAllWhaleTransactions.mockResolvedValue(transactions)
      expect(await controller.getWhaleTransactions(query)).toEqual(transactions)
      expect(whaleTransactionService.findAllWhaleTransactions).toHaveBeenCalledWith(query)
    })
  })

  describe("getWhaleTransactionCount", () => {
    it("should return the count of whale transactions", async () => {
      const query = { blockchain: "ethereum" }
      mockWhaleTransactionService.getWhaleTransactionCount.mockResolvedValue(10)
      expect(await controller.getWhaleTransactionCount(query)).toEqual({ count: 10 })
      expect(whaleTransactionService.getWhaleTransactionCount).toHaveBeenCalledWith(query)
    })
  })

  describe("getWhaleAlerts", () => {
    it("should return whale alerts based on query", async () => {
      const query = { type: WhaleAlertType.LARGE_TRANSFER, isRead: "false" } as any
      const alerts = [{ id: "alert1", type: WhaleAlertType.LARGE_TRANSFER, isRead: false }]
      mockWhaleAlertService.getAlerts.mockResolvedValue(alerts)
      expect(await controller.getWhaleAlerts(query)).toEqual(alerts)
      expect(whaleAlertService.getAlerts).toHaveBeenCalledWith(WhaleAlertType.LARGE_TRANSFER, undefined, false)
    })
  })

  describe("markAlertAsRead", () => {
    it("should mark an alert as read", async () => {
      const updatedAlert = { id: "alert1", isRead: true } as any
      mockWhaleAlertService.markAlertAsRead.mockResolvedValue(updatedAlert)
      expect(await controller.markAlertAsRead("alert1")).toEqual(updatedAlert)
      expect(whaleAlertService.markAlertAsRead).toHaveBeenCalledWith("alert1")
    })
  })

  describe("getUnreadAlertCount", () => {
    it("should return the count of unread alerts", async () => {
      const query = { blockchain: "ethereum", severity: WhaleAlertSeverity.HIGH } as any
      mockWhaleAlertService.getUnreadAlertCount.mockResolvedValue(5)
      expect(await controller.getUnreadAlertCount(query)).toEqual({ count: 5 })
      expect(whaleAlertService.getUnreadAlertCount).toHaveBeenCalledWith(query)
    })
  })

  describe("getHeatmapData", () => {
    it("should return heatmap data", async () => {
      const query = { blockchain: "ethereum" }
      const heatmapData = [{ timestamp: "2024-01-01T00:00:00Z", blockchain: "ethereum", totalWhaleVolumeUSD: 1000000 }]
      mockWhaleAnalyticsService.getHeatmapData.mockResolvedValue(heatmapData)
      expect(await controller.getHeatmapData(query)).toEqual(heatmapData)
      expect(whaleAnalyticsService.getHeatmapData).toHaveBeenCalledWith(query)
    })
  })

  describe("getWhaleVolumeTrends", () => {
    it("should return whale volume trends", async () => {
      const query = { assetSymbol: "ETH" }
      const trends = [{ period: "2024-01-01", totalVolumeUSD: 5000000, whaleVolumeUSD: 2000000 }]
      mockWhaleAnalyticsService.getWhaleVolumeTrends.mockResolvedValue(trends)
      expect(await controller.getWhaleVolumeTrends(query)).toEqual(trends)
      expect(whaleAnalyticsService.getWhaleVolumeTrends).toHaveBeenCalledWith(query)
    })
  })

  describe("getTopWhaleTransactions", () => {
    it("should return top whale transactions with default limit", async () => {
      const topTxs = [{ amountUSD: 5000000 }]
      mockWhaleAnalyticsService.getTopWhaleTransactions.mockResolvedValue(topTxs)
      expect(await controller.getTopWhaleTransactions()).toEqual(topTxs)
      expect(whaleAnalyticsService.getTopWhaleTransactions).toHaveBeenCalledWith(10)
    })

    it("should return top whale transactions with custom limit", async () => {
      const topTxs = [{ amountUSD: 5000000 }]
      mockWhaleAnalyticsService.getTopWhaleTransactions.mockResolvedValue(topTxs)
      expect(await controller.getTopWhaleTransactions(5)).toEqual(topTxs)
      expect(whaleAnalyticsService.getTopWhaleTransactions).toHaveBeenCalledWith(5)
    })
  })
})
