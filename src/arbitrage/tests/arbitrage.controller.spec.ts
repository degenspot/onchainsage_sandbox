import { Test, type TestingModule } from "@nestjs/testing"
import { ArbitrageController } from "../controllers/arbitrage.controller"
import { DexPriceService } from "../services/dex-price.service"
import { ArbitrageFinderService } from "../services/arbitrage-finder.service"
import { ArbitrageEventService } from "../services/arbitrage-event.service"
import { ArbitrageAlertService } from "../services/arbitrage-alert.service"
import { ArbitrageAnalyticsService } from "../services/arbitrage-analytics.service"
import { ArbitrageAlertType, ArbitrageAlertSeverity } from "../entities/arbitrage-alert.entity"
import { ArbitrageEventStatus } from "../entities/arbitrage-event.entity"
import { jest } from "@jest/globals"

describe("ArbitrageController", () => {
  let controller: ArbitrageController
  let dexPriceService: DexPriceService
  let arbitrageFinderService: ArbitrageFinderService
  let arbitrageEventService: ArbitrageEventService
  let arbitrageAlertService: ArbitrageAlertService
  let arbitrageAnalyticsService: ArbitrageAnalyticsService

  const mockDexPriceService = {
    fetchAndStoreMockPrices: jest.fn(),
    getLatestPrices: jest.fn(),
    getPriceHistory: jest.fn(),
  }

  const mockArbitrageFinderService = {
    scanForOpportunities: jest.fn(),
    getActiveOpportunities: jest.fn(),
    markOpportunityAsInactive: jest.fn(),
  }

  const mockArbitrageEventService = {
    recordArbitrageEvent: jest.fn(),
    getHistoricalEvents: jest.fn(),
    getProfitabilitySummary: jest.fn(),
    getArbitrageTrends: jest.fn(),
  }

  const mockArbitrageAlertService = {
    getAlerts: jest.fn(),
    markAlertAsRead: jest.fn(),
    getUnreadAlertCount: jest.fn(),
  }

  const mockArbitrageAnalyticsService = {
    getOverallAnalytics: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArbitrageController],
      providers: [
        { provide: DexPriceService, useValue: mockDexPriceService },
        { provide: ArbitrageFinderService, useValue: mockArbitrageFinderService },
        { provide: ArbitrageEventService, useValue: mockArbitrageEventService },
        { provide: ArbitrageAlertService, useValue: mockArbitrageAlertService },
        { provide: ArbitrageAnalyticsService, useValue: mockArbitrageAnalyticsService },
      ],
    }).compile()

    controller = module.get<ArbitrageController>(ArbitrageController)
    dexPriceService = module.get<DexPriceService>(DexPriceService)
    arbitrageFinderService = module.get<ArbitrageFinderService>(ArbitrageFinderService)
    arbitrageEventService = module.get<ArbitrageEventService>(ArbitrageEventService)
    arbitrageAlertService = module.get<ArbitrageAlertService>(ArbitrageAlertService)
    arbitrageAnalyticsService = module.get<ArbitrageAnalyticsService>(ArbitrageAnalyticsService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("fetchAndStoreMockPrices", () => {
    it("should call dexPriceService.fetchAndStoreMockPrices", async () => {
      mockDexPriceService.fetchAndStoreMockPrices.mockResolvedValue([])
      await controller.fetchAndStoreMockPrices()
      expect(mockDexPriceService.fetchAndStoreMockPrices).toHaveBeenCalled()
    })
  })

  describe("getLatestPrices", () => {
    it("should call dexPriceService.getLatestPrices with query params", async () => {
      mockDexPriceService.getLatestPrices.mockResolvedValue([])
      await controller.getLatestPrices("ETH", "ethereum", "uniswap_v3")
      expect(mockDexPriceService.getLatestPrices).toHaveBeenCalledWith("ETH", "ethereum", "uniswap_v3")
    })
  })

  describe("getPriceHistory", () => {
    it("should call dexPriceService.getPriceHistory with query params", async () => {
      mockDexPriceService.getPriceHistory.mockResolvedValue([])
      await controller.getPriceHistory("ETH", "ethereum", "uniswap_v3", 50)
      expect(mockDexPriceService.getPriceHistory).toHaveBeenCalledWith("ETH", "ethereum", "uniswap_v3", 50)
    })
  })

  describe("scanForOpportunities", () => {
    it("should call arbitrageFinderService.scanForOpportunities with query params", async () => {
      mockArbitrageFinderService.scanForOpportunities.mockResolvedValue([])
      await controller.scanForOpportunities(0.5, 100)
      expect(mockArbitrageFinderService.scanForOpportunities).toHaveBeenCalledWith(0.5, 100)
    })
  })

  describe("getActiveOpportunities", () => {
    it("should call arbitrageFinderService.getActiveOpportunities", async () => {
      mockArbitrageFinderService.getActiveOpportunities.mockResolvedValue([])
      await controller.getActiveOpportunities()
      expect(mockArbitrageFinderService.getActiveOpportunities).toHaveBeenCalled()
    })
  })

  describe("markOpportunityAsInactive", () => {
    it("should call arbitrageFinderService.markOpportunityAsInactive", async () => {
      mockArbitrageFinderService.markOpportunityAsInactive.mockResolvedValue({})
      await controller.markOpportunityAsInactive("some-id")
      expect(mockArbitrageFinderService.markOpportunityAsInactive).toHaveBeenCalledWith("some-id")
    })
  })

  describe("recordArbitrageEvent", () => {
    it("should call arbitrageEventService.recordArbitrageEvent", async () => {
      const dto = {
        tokenPair: "ETH/USDC",
        chain1: "ethereum",
        dex1: "uniswap_v3",
        chain2: "polygon",
        dex2: "quickswap",
        executedProfitUSD: 100,
        status: ArbitrageEventStatus.EXECUTED,
      }
      mockArbitrageEventService.recordArbitrageEvent.mockResolvedValue({})
      await controller.recordArbitrageEvent(dto)
      expect(mockArbitrageEventService.recordArbitrageEvent).toHaveBeenCalledWith(dto)
    })
  })

  describe("getHistoricalEvents", () => {
    it("should call arbitrageEventService.getHistoricalEvents with query params", async () => {
      mockArbitrageEventService.getHistoricalEvents.mockResolvedValue([])
      const query = { tokenPair: "ETH/USDC" }
      await controller.getHistoricalEvents(query)
      expect(mockArbitrageEventService.getHistoricalEvents).toHaveBeenCalledWith(query)
    })
  })

  describe("getProfitabilitySummary", () => {
    it("should call arbitrageEventService.getProfitabilitySummary with query params", async () => {
      mockArbitrageEventService.getProfitabilitySummary.mockResolvedValue({})
      const query = { startDate: "2024-01-01" }
      await controller.getProfitabilitySummary(query)
      expect(mockArbitrageEventService.getProfitabilitySummary).toHaveBeenCalledWith(query)
    })
  })

  describe("getArbitrageTrends", () => {
    it("should call arbitrageEventService.getArbitrageTrends with query params", async () => {
      mockArbitrageEventService.getArbitrageTrends.mockResolvedValue([])
      const query = { chain: "ethereum" }
      await controller.getArbitrageTrends(query)
      expect(mockArbitrageEventService.getArbitrageTrends).toHaveBeenCalledWith(query)
    })
  })

  describe("getOverallAnalytics", () => {
    it("should call arbitrageAnalyticsService.getOverallAnalytics with query params", async () => {
      mockArbitrageAnalyticsService.getOverallAnalytics.mockResolvedValue({})
      const query = { tokenPair: "ETH/USDC" }
      await controller.getOverallAnalytics(query)
      expect(mockArbitrageAnalyticsService.getOverallAnalytics).toHaveBeenCalledWith(query)
    })
  })

  describe("getAlerts", () => {
    it("should call arbitrageAlertService.getAlerts with query params", async () => {
      mockArbitrageAlertService.getAlerts.mockResolvedValue([])
      await controller.getAlerts(ArbitrageAlertType.PRICE_DISCREPANCY, ArbitrageAlertSeverity.HIGH, "true")
      expect(mockArbitrageAlertService.getAlerts).toHaveBeenCalledWith(
        ArbitrageAlertType.PRICE_DISCREPANCY,
        ArbitrageAlertSeverity.HIGH,
        true,
      )
    })
  })

  describe("markAlertAsRead", () => {
    it("should call arbitrageAlertService.markAlertAsRead", async () => {
      mockArbitrageAlertService.markAlertAsRead.mockResolvedValue({})
      await controller.markAlertAsRead("alert-id")
      expect(mockArbitrageAlertService.markAlertAsRead).toHaveBeenCalledWith("alert-id")
    })
  })

  describe("getUnreadAlertCount", () => {
    it("should call arbitrageAlertService.getUnreadAlertCount with query params", async () => {
      mockArbitrageAlertService.getUnreadAlertCount.mockResolvedValue(5)
      const result = await controller.getUnreadAlertCount(
        ArbitrageAlertType.HIGH_PROFIT_OPPORTUNITY,
        ArbitrageAlertSeverity.CRITICAL,
      )
      expect(mockArbitrageAlertService.getUnreadAlertCount).toHaveBeenCalledWith(
        ArbitrageAlertType.HIGH_PROFIT_OPPORTUNITY,
        ArbitrageAlertSeverity.CRITICAL,
      )
      expect(result).toEqual({ count: 5 })
    })
  })
})
