import { Test, type TestingModule } from "@nestjs/testing"
import { TokenQualityController } from "../controllers/token-quality.controller"
import { TokenService } from "../services/token.service"
import { TokenQualityScoringService } from "../services/token-quality-scoring.service"
import { OnChainDataService } from "../services/on-chain-data.service"
import { SocialDataService } from "../services/social-data.service"
import { DeveloperDataService } from "../services/developer-data.service"
import { getRepositoryToken } from "@nestjs/typeorm"
import { Token } from "../entities/token.entity"
import { TokenQualityScore } from "../entities/token-quality-score.entity"
import { OnChainMetric } from "../entities/on-chain-metric.entity"
import { SocialSentimentMetric } from "../entities/social-sentiment-metric.entity"
import { DeveloperActivityMetric } from "../entities/developer-activity-metric.entity"
import { Repository } from "typeorm"
import { jest } from "@jest/globals"

describe("TokenQualityController", () => {
  let controller: TokenQualityController
  let tokenService: TokenService
  let scoringService: TokenQualityScoringService
  let onChainDataService: OnChainDataService
  let socialDataService: SocialDataService
  let developerDataService: DeveloperDataService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenQualityController],
      providers: [
        TokenService,
        TokenQualityScoringService,
        OnChainDataService,
        SocialDataService,
        DeveloperDataService,
        {
          provide: getRepositoryToken(Token),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(TokenQualityScore),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(OnChainMetric),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(SocialSentimentMetric),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(DeveloperActivityMetric),
          useClass: Repository,
        },
      ],
    }).compile()

    controller = module.get<TokenQualityController>(TokenQualityController)
    tokenService = module.get<TokenService>(TokenService)
    scoringService = module.get<TokenQualityScoringService>(TokenQualityScoringService)
    onChainDataService = module.get<OnChainDataService>(OnChainDataService)
    socialDataService = module.get<SocialDataService>(SocialDataService)
    developerDataService = module.get<DeveloperDataService>(DeveloperDataService)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("createToken", () => {
    it("should create a new token", async () => {
      const createDto = { symbol: "TEST", name: "Test Token" }
      const expectedToken = { ...createDto, symbol: "TEST", createdAt: new Date(), updatedAt: new Date() } as Token
      jest.spyOn(tokenService, "create").mockResolvedValue(expectedToken)

      expect(await controller.createToken(createDto)).toEqual(expectedToken)
    })
  })

  describe("getAllTokens", () => {
    it("should return an array of tokens", async () => {
      const expectedTokens: Token[] = [
        { symbol: "BTC", name: "Bitcoin", createdAt: new Date(), updatedAt: new Date(), currentQualityScore: 75 },
      ]
      jest.spyOn(tokenService, "findAll").mockResolvedValue(expectedTokens)

      expect(await controller.getAllTokens()).toEqual(expectedTokens)
    })
  })

  describe("runScoringCycle", () => {
    it("should initiate the scoring cycle", async () => {
      jest.spyOn(scoringService, "runScoringCycle").mockResolvedValue(undefined)
      const result = await controller.runScoringCycle()
      expect(result).toEqual({ message: "Token quality scoring cycle initiated." })
      expect(scoringService.runScoringCycle).toHaveBeenCalled()
    })
  })

  describe("ingestMockDataForToken", () => {
    it("should ingest mock data for a given token", async () => {
      const symbol = "ETH"
      jest.spyOn(onChainDataService, "fetchAndSaveMockMetrics").mockResolvedValue(null)
      jest.spyOn(socialDataService, "fetchAndSaveMockMetrics").mockResolvedValue(null)
      jest.spyOn(developerDataService, "fetchAndSaveMockMetrics").mockResolvedValue(null)

      const result = await controller.ingestMockDataForToken(symbol)
      expect(result).toEqual({ message: `Mock data ingested for ${symbol}.` })
      expect(onChainDataService.fetchAndSaveMockMetrics).toHaveBeenCalledWith(symbol)
      expect(socialDataService.fetchAndSaveMockMetrics).toHaveBeenCalledWith(symbol)
      expect(developerDataService.fetchAndSaveMockMetrics).toHaveBeenCalledWith(symbol)
    })
  })

  describe("getLatestTokenQualityScore", () => {
    it("should return the latest quality score for a token", async () => {
      const symbol = "SOL"
      const expectedScore = {
        id: "uuid",
        tokenSymbol: symbol,
        score: 88.5,
        onChainScore: 90,
        socialScore: 85,
        devScore: 92,
        timestamp: new Date(),
      } as TokenQualityScore
      jest.spyOn(scoringService, "getLatestScore").mockResolvedValue(expectedScore)

      expect(await controller.getLatestTokenQualityScore(symbol)).toEqual(expectedScore)
    })
  })

  describe("getHistoricalTokenQualityScores", () => {
    it("should return historical quality scores for a token", async () => {
      const symbol = "ADA"
      const query = { startDate: "2023-01-01", endDate: "2023-01-31", limit: "5" }
      const expectedHistory = [
        { timestamp: new Date("2023-01-01"), score: 70 },
        { timestamp: new Date("2023-01-02"), score: 72 },
      ]
      jest.spyOn(scoringService, "getHistoricalScores").mockResolvedValue(expectedHistory)

      expect(await controller.getHistoricalTokenQualityScores(symbol, query)).toEqual(expectedHistory)
      expect(scoringService.getHistoricalScores).toHaveBeenCalledWith(
        symbol,
        new Date(query.startDate),
        new Date(query.endDate),
        Number.parseInt(query.limit, 10),
      )
    })
  })

  describe("getTokenQualitySummary", () => {
    it("should return a summary of token quality and metrics", async () => {
      const symbol = "XRP"
      const expectedSummary = {
        tokenSymbol: "XRP",
        name: "Ripple",
        currentQualityScore: 65.2,
        lastUpdated: new Date(),
        onChainMetrics: { volume24h: 1000000, activeHolders: "50000", liquidity: 200000, priceUsd: 0.5 },
        socialSentiment: { sentimentScore: 0.6, mentionCount: 1000 },
        developerActivity: { commits24h: 5, uniqueContributors24h: 2, forks: 100, stars: 500 },
      }
      jest.spyOn(scoringService, "getTokenQualitySummary").mockResolvedValue(expectedSummary)

      expect(await controller.getTokenQualitySummary(symbol)).toEqual(expectedSummary)
    })
  })

  describe("getOnChainMetrics", () => {
    it("should return historical on-chain metrics", async () => {
      const symbol = "LTC"
      const query = { limit: "1" }
      const expectedMetrics = [
        { id: "uuid", tokenSymbol: "LTC", volume24h: 1000, timestamp: new Date() },
      ] as OnChainMetric[]
      jest.spyOn(onChainDataService, "getHistoricalMetrics").mockResolvedValue(expectedMetrics)

      expect(await controller.getOnChainMetrics(symbol, query)).toEqual(expectedMetrics)
    })
  })

  describe("getSocialMetrics", () => {
    it("should return historical social metrics", async () => {
      const symbol = "DOGE"
      const query = { limit: "1" }
      const expectedMetrics = [
        { id: "uuid", tokenSymbol: "DOGE", sentimentScore: 0.5, timestamp: new Date() },
      ] as SocialSentimentMetric[]
      jest.spyOn(socialDataService, "getHistoricalMetrics").mockResolvedValue(expectedMetrics)

      expect(await controller.getSocialMetrics(symbol, query)).toEqual(expectedMetrics)
    })
  })

  describe("getDeveloperMetrics", () => {
    it("should return historical developer metrics", async () => {
      const symbol = "DOT"
      const query = { limit: "1" }
      const expectedMetrics = [
        { id: "uuid", tokenSymbol: "DOT", commits24h: 10, timestamp: new Date() },
      ] as DeveloperActivityMetric[]
      jest.spyOn(developerDataService, "getHistoricalMetrics").mockResolvedValue(expectedMetrics)

      expect(await controller.getDeveloperMetrics(symbol, query)).toEqual(expectedMetrics)
    })
  })
})
