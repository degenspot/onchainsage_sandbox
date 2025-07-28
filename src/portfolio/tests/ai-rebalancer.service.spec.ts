import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AIRebalancerService } from "../services/ai-rebalancer.service"
import {
  RebalancingSuggestion,
  SuggestionStatus,
  RebalancingActionType,
} from "../entities/rebalancing-suggestion.entity"
import { type UserPortfolio, RiskProfile } from "../entities/user-portfolio.entity"
import { MarketDataService } from "../services/market-data.service"
import { SocialSentimentService } from "../services/social-sentiment.service"
import { type MarketTrend, TrendType } from "../entities/market-trend.entity"
import type { SocialSentiment } from "../entities/social-sentiment.entity"
import { NotFoundException } from "@nestjs/common"
import { jest } from "@jest/globals"

describe("AIRebalancerService", () => {
  let service: AIRebalancerService
  let suggestionRepository: Repository<RebalancingSuggestion>
  let marketDataService: MarketDataService
  let socialSentimentService: SocialSentimentService

  const mockSuggestionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  }

  const mockMarketDataService = {
    getLatestMarketTrend: jest.fn(),
  }

  const mockSocialSentimentService = {
    getLatestSocialSentiment: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIRebalancerService,
        {
          provide: getRepositoryToken(RebalancingSuggestion),
          useValue: mockSuggestionRepository,
        },
        {
          provide: MarketDataService,
          useValue: mockMarketDataService,
        },
        {
          provide: SocialSentimentService,
          useValue: mockSocialSentimentService,
        },
      ],
    }).compile()

    service = module.get<AIRebalancerService>(AIRebalancerService)
    suggestionRepository = module.get<Repository<RebalancingSuggestion>>(getRepositoryToken(RebalancingSuggestion))
    marketDataService = module.get<MarketDataService>(MarketDataService)
    socialSentimentService = module.get<SocialSentimentService>(SocialSentimentService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("generateRebalancingSuggestion", () => {
    const mockPortfolio: UserPortfolio = {
      id: "portfolio-1",
      userId: "user-1",
      totalValueUSD: 10000,
      riskProfile: RiskProfile.MODERATE,
      targetAllocation: { BTC: 0.6, ETH: 0.4 },
      assets: [
        { symbol: "BTC", quantity: 0.2, currentPriceUSD: 30000, valueUSD: 6000 } as any, // 60%
        { symbol: "ETH", quantity: 1, currentPriceUSD: 2000, valueUSD: 2000 } as any, // 20%
        { symbol: "ADA", quantity: 1000, currentPriceUSD: 2, valueUSD: 2000 } as any, // 20% - over-allocated
      ],
    } as UserPortfolio

    it("should return null if no target allocation", async () => {
      const portfolioWithoutTarget = { ...mockPortfolio, targetAllocation: {} } as UserPortfolio
      const result = await service.generateRebalancingSuggestion(portfolioWithoutTarget)
      expect(result).toBeNull()
    })

    it("should generate buy and sell suggestions based on deviation", async () => {
      mockMarketDataService.getLatestMarketTrend.mockResolvedValue(null)
      mockSocialSentimentService.getLatestSocialSentiment.mockResolvedValue(null)

      mockSuggestionRepository.create.mockImplementation((data) => ({ id: "sugg-1", ...data }))
      mockSuggestionRepository.save.mockImplementation((data) => Promise.resolve(data))

      const result = await service.generateRebalancingSuggestion(mockPortfolio)

      expect(result).toBeDefined()
      expect(result.actions).toHaveLength(3) // BTC, ETH, ADA
      expect(result.actions[0].type).toBe(RebalancingActionType.BUY) // ETH: 0.4 target, 0.2 current -> buy
      expect(result.actions[0].symbol).toBe("ETH")
      expect(result.actions[0].amountUSD).toBeCloseTo(2000, 2) // (0.4 - 0.2) * 10000

      expect(result.actions[1].type).toBe(RebalancingActionType.SELL) // ADA: 0 target, 0.2 current -> sell
      expect(result.actions[1].symbol).toBe("ADA")
      expect(result.actions[1].amountUSD).toBeCloseTo(2000, 2) // (0.2 - 0) * 10000

      expect(result.actions[2].type).toBe(RebalancingActionType.SELL) // BTC: 0.6 target, 0.6 current -> no change
      expect(result.actions[2].symbol).toBe("BTC")
      expect(result.actions[2].amountUSD).toBeCloseTo(0, 2) // (0.6 - 0.6) * 10000

      expect(result.estimatedImpactUSD).toBeCloseTo(4000, 2) // 2000 (buy ETH) + 2000 (sell ADA)
      expect(result.reasoning).toContain("You are under-allocated in ETH by 20.00%.")
      expect(result.reasoning).toContain("You are over-allocated in ADA by 20.00%.")
      expect(suggestionRepository.save).toHaveBeenCalled()
    })

    it("should adjust suggestions based on risk profile and market/sentiment", async () => {
      const aggressivePortfolio = { ...mockPortfolio, riskProfile: RiskProfile.AGGRESSIVE }
      mockMarketDataService.getLatestMarketTrend.mockImplementation((symbol) => {
        if (symbol === "ETH") return { trendType: TrendType.BULLISH, strength: 0.8 } as MarketTrend
        if (symbol === "ADA") return { trendType: TrendType.BEARISH, strength: 0.7 } as MarketTrend
        return null
      })
      mockSocialSentimentService.getLatestSocialSentiment.mockImplementation((symbol) => {
        if (symbol === "ETH") return { sentimentScore: 0.7 } as SocialSentiment
        if (symbol === "ADA") return { sentimentScore: -0.6 } as SocialSentiment
        return null
      })

      mockSuggestionRepository.create.mockImplementation((data) => ({ id: "sugg-2", ...data }))
      mockSuggestionRepository.save.mockImplementation((data) => Promise.resolve(data))

      const result = await service.generateRebalancingSuggestion(aggressivePortfolio)

      expect(result).toBeDefined()
      const ethAction = result.actions.find((a) => a.symbol === "ETH")
      const adaAction = result.actions.find((a) => a.symbol === "ADA")

      expect(ethAction.amountUSD).toBeCloseTo(2000 * 1.2, 2) // Aggressive, bullish trend -> buy more
      expect(adaAction.amountUSD).toBeCloseTo(2000 * 1.2, 2) // Aggressive, bearish trend -> sell more
      expect(ethAction.reason).toContain("Market trend for ETH is bullish.")
      expect(ethAction.reason).toContain("Social sentiment for ETH is positive.")
      expect(adaAction.reason).toContain("Market trend for ADA is bearish.")
      expect(adaAction.reason).toContain("Social sentiment for ADA is negative.")
    })

    it("should return null if no rebalancing needed", async () => {
      const balancedPortfolio = {
        ...mockPortfolio,
        assets: [
          { symbol: "BTC", quantity: 0.2, currentPriceUSD: 30000, valueUSD: 6000 } as any, // 60%
          { symbol: "ETH", quantity: 2, currentPriceUSD: 2000, valueUSD: 4000 } as any, // 40%
        ],
      } as UserPortfolio
      mockMarketDataService.getLatestMarketTrend.mockResolvedValue(null)
      mockSocialSentimentService.getLatestSocialSentiment.mockResolvedValue(null)

      const result = await service.generateRebalancingSuggestion(balancedPortfolio)
      expect(result).toBeNull()
      expect(suggestionRepository.save).not.toHaveBeenCalled()
    })
  })

  describe("getSuggestionsForPortfolio", () => {
    it("should return suggestions for a portfolio", async () => {
      const portfolioId = "portfolio-1"
      const mockSuggestions = [{ id: "sugg-1", portfolioId }]
      mockSuggestionRepository.find.mockResolvedValue(mockSuggestions)

      const result = await service.getSuggestionsForPortfolio(portfolioId)

      expect(mockSuggestionRepository.find).toHaveBeenCalledWith({
        where: { portfolioId },
        order: { suggestedAt: "DESC" },
      })
      expect(result).toEqual(mockSuggestions)
    })
  })

  describe("getSuggestionById", () => {
    it("should return a suggestion by ID", async () => {
      const suggestionId = "sugg-1"
      const mockSuggestion = { id: suggestionId }
      mockSuggestionRepository.findOne.mockResolvedValue(mockSuggestion)

      const result = await service.getSuggestionById(suggestionId)

      expect(mockSuggestionRepository.findOne).toHaveBeenCalledWith({ where: { id: suggestionId } })
      expect(result).toEqual(mockSuggestion)
    })

    it("should throw NotFoundException if suggestion not found", async () => {
      mockSuggestionRepository.findOne.mockResolvedValue(null)
      await expect(service.getSuggestionById("non-existent")).rejects.toThrow(NotFoundException)
    })
  })

  describe("updateSuggestionStatus", () => {
    it("should update suggestion status to ACCEPTED and set acceptedAt", async () => {
      const suggestionId = "sugg-1"
      const updatedSuggestion = { id: suggestionId, status: SuggestionStatus.ACCEPTED, acceptedAt: expect.any(Date) }
      mockSuggestionRepository.update.mockResolvedValue({ affected: 1 })
      mockSuggestionRepository.findOne.mockResolvedValue(updatedSuggestion)

      const result = await service.updateSuggestionStatus(suggestionId, SuggestionStatus.ACCEPTED)

      expect(mockSuggestionRepository.update).toHaveBeenCalledWith(suggestionId, {
        status: SuggestionStatus.ACCEPTED,
        acceptedAt: expect.any(Date),
      })
      expect(result.status).toBe(SuggestionStatus.ACCEPTED)
      expect(result.acceptedAt).toBeInstanceOf(Date)
    })

    it("should update suggestion status to REJECTED and clear acceptedAt", async () => {
      const suggestionId = "sugg-1"
      const updatedSuggestion = { id: suggestionId, status: SuggestionStatus.REJECTED, acceptedAt: null }
      mockSuggestionRepository.update.mockResolvedValue({ affected: 1 })
      mockSuggestionRepository.findOne.mockResolvedValue(updatedSuggestion)

      const result = await service.updateSuggestionStatus(suggestionId, SuggestionStatus.REJECTED)

      expect(mockSuggestionRepository.update).toHaveBeenCalledWith(suggestionId, {
        status: SuggestionStatus.REJECTED,
        acceptedAt: null,
      })
      expect(result.status).toBe(SuggestionStatus.REJECTED)
      expect(result.acceptedAt).toBeNull()
    })
  })
})
