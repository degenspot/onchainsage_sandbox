import { Test, type TestingModule } from "@nestjs/testing"
import { NarrativeController } from "../controllers/narrative.controller"
import { NarrativeService } from "../services/narrative.service"
import { NarrativePredictionService } from "../services/narrative-prediction.service"
import { NarrativeAlertService } from "../services/narrative-alert.service"
import { NarrativeAnalyticsService } from "../services/narrative-analytics.service"
import { SocialDataIngestionService } from "../services/social-data-ingestion.service"
import { NewsDataIngestionService } from "../services/news-data-ingestion.service"
import type { CreateNarrativeDto } from "../dto/create-narrative.dto"
import { NarrativeStatus } from "../entities/narrative.entity"
import { NarrativeAlertType } from "../entities/narrative-alert.entity"
import { type CreateSocialPostDto, SocialPlatform } from "../dto/create-social-post.dto"
import type { CreateNewsArticleDto } from "../dto/create-news-article.dto"
import { jest } from "@jest/globals"

describe("NarrativeController", () => {
  let controller: NarrativeController
  let narrativeService: NarrativeService
  let narrativePredictionService: NarrativePredictionService
  let narrativeAlertService: NarrativeAlertService
  let narrativeAnalyticsService: NarrativeAnalyticsService
  let socialDataIngestionService: SocialDataIngestionService
  let newsDataIngestionService: NewsDataIngestionService

  const mockNarrativeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  const mockNarrativePredictionService = {
    runPredictionCycle: jest.fn(),
  }

  const mockNarrativeAlertService = {
    getAlerts: jest.fn(),
    markAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
  }

  const mockNarrativeAnalyticsService = {
    getOverallNarrativeSummary: jest.fn(),
    getNarrativeTrends: jest.fn(),
    getTopTokensByNarrative: jest.fn(),
    getSentimentBreakdown: jest.fn(),
  }

  const mockSocialDataIngestionService = {
    ingestSocialPost: jest.fn(),
    fetchAndIngestMockData: jest.fn(),
    getSocialPosts: jest.fn(),
  }

  const mockNewsDataIngestionService = {
    ingestNewsArticle: jest.fn(),
    fetchAndIngestMockData: jest.fn(),
    getNewsArticles: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NarrativeController],
      providers: [
        { provide: NarrativeService, useValue: mockNarrativeService },
        { provide: NarrativePredictionService, useValue: mockNarrativePredictionService },
        { provide: NarrativeAlertService, useValue: mockNarrativeAlertService },
        { provide: NarrativeAnalyticsService, useValue: mockNarrativeAnalyticsService },
        { provide: SocialDataIngestionService, useValue: mockSocialDataIngestionService },
        { provide: NewsDataIngestionService, useValue: mockNewsDataIngestionService },
      ],
    }).compile()

    controller = module.get<NarrativeController>(NarrativeController)
    narrativeService = module.get<NarrativeService>(NarrativeService)
    narrativePredictionService = module.get<NarrativePredictionService>(NarrativePredictionService)
    narrativeAlertService = module.get<NarrativeAlertService>(NarrativeAlertService)
    narrativeAnalyticsService = module.get<NarrativeAnalyticsService>(NarrativeAnalyticsService)
    socialDataIngestionService = module.get<SocialDataIngestionService>(SocialDataIngestionService)
    newsDataIngestionService = module.get<NewsDataIngestionService>(NewsDataIngestionService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("createNarrative", () => {
    it("should create a new narrative", async () => {
      const createDto: CreateNarrativeDto = {
        name: "DeFi 2.0",
        description: "Next generation of DeFi protocols",
        associatedTokens: ["UNI", "AAVE"],
        keywords: ["yield", "lending"],
        sentimentScore: 0.5,
        trendScore: 0.7,
        status: NarrativeStatus.EMERGING,
        lastDetectedAt: new Date().toISOString(),
      }
      const expectedResult = { id: "uuid-1", ...createDto }
      mockNarrativeService.create.mockResolvedValue(expectedResult)

      const result = await controller.createNarrative(createDto)
      expect(narrativeService.create).toHaveBeenCalledWith(createDto)
      expect(result).toEqual(expectedResult)
    })
  })

  describe("getNarratives", () => {
    it("should return a list of narratives", async () => {
      const query = { status: NarrativeStatus.TRENDING }
      const expectedResult = [{ id: "uuid-1", name: "DeFi 2.0", status: NarrativeStatus.TRENDING }]
      mockNarrativeService.findAll.mockResolvedValue(expectedResult)

      const result = await controller.getNarratives(query)
      expect(narrativeService.findAll).toHaveBeenCalledWith(query)
      expect(result).toEqual(expectedResult)
    })
  })

  describe("getNarrativeById", () => {
    it("should return a single narrative by ID", async () => {
      const narrativeId = "uuid-1"
      const expectedResult = { id: narrativeId, name: "DeFi 2.0" }
      mockNarrativeService.findOne.mockResolvedValue(expectedResult)

      const result = await controller.getNarrativeById(narrativeId)
      expect(narrativeService.findOne).toHaveBeenCalledWith(narrativeId)
      expect(result).toEqual(expectedResult)
    })
  })

  describe("updateNarrative", () => {
    it("should update a narrative", async () => {
      const narrativeId = "uuid-1"
      const updateData = { description: "Updated description" }
      const expectedResult = { id: narrativeId, name: "DeFi 2.0", description: "Updated description" }
      mockNarrativeService.update.mockResolvedValue(expectedResult)

      const result = await controller.updateNarrative(narrativeId, updateData)
      expect(narrativeService.update).toHaveBeenCalledWith(narrativeId, updateData)
      expect(result).toEqual(expectedResult)
    })
  })

  describe("deleteNarrative", () => {
    it("should delete a narrative", async () => {
      const narrativeId = "uuid-1"
      mockNarrativeService.delete.mockResolvedValue(undefined)

      await controller.deleteNarrative(narrativeId)
      expect(narrativeService.delete).toHaveBeenCalledWith(narrativeId)
    })
  })

  describe("ingestSocialPost", () => {
    it("should ingest a social post", async () => {
      const createDto: CreateSocialPostDto = {
        externalId: "tweet-123",
        authorId: "user-abc",
        content: "This is a test tweet about DeFi.",
        platform: SocialPlatform.TWITTER,
        timestamp: new Date().toISOString(),
      }
      const expectedResult = { id: "post-1", ...createDto }
      mockSocialDataIngestionService.ingestSocialPost.mockResolvedValue(expectedResult)

      const result = await controller.ingestSocialPost(createDto)
      expect(socialDataIngestionService.ingestSocialPost).toHaveBeenCalledWith(createDto)
      expect(result).toEqual(expectedResult)
    })
  })

  describe("ingestNewsArticle", () => {
    it("should ingest a news article", async () => {
      const createDto: CreateNewsArticleDto = {
        externalId: "news-abc",
        title: "DeFi Growth Continues",
        content: "DeFi protocols are seeing significant growth.",
        url: "http://example.com/news",
        source: "CoinDesk",
        publishedAt: new Date().toISOString(),
      }
      const expectedResult = { id: "article-1", ...createDto }
      mockNewsDataIngestionService.ingestNewsArticle.mockResolvedValue(expectedResult)

      const result = await controller.ingestNewsArticle(createDto)
      expect(newsDataIngestionService.ingestNewsArticle).toHaveBeenCalledWith(createDto)
      expect(result).toEqual(expectedResult)
    })
  })

  describe("runPredictionCycle", () => {
    it("should initiate the prediction cycle", async () => {
      mockNarrativePredictionService.runPredictionCycle.mockResolvedValue(undefined)

      const result = await controller.runPredictionCycle()
      expect(narrativePredictionService.runPredictionCycle).toHaveBeenCalled()
      expect(result).toEqual({ message: "Narrative prediction cycle initiated." })
    })
  })

  describe("ingestMockSocialData", () => {
    it("should ingest mock social data with default count", async () => {
      mockSocialDataIngestionService.fetchAndIngestMockData.mockResolvedValue([])
      await controller.ingestMockSocialData()
      expect(mockSocialDataIngestionService.fetchAndIngestMockData).toHaveBeenCalledWith(10)
    })

    it("should ingest mock social data with custom count", async () => {
      mockSocialDataIngestionService.fetchAndIngestMockData.mockResolvedValue([])
      await controller.ingestMockSocialData("25")
      expect(mockSocialDataIngestionService.fetchAndIngestMockData).toHaveBeenCalledWith(25)
    })
  })

  describe("ingestMockNewsData", () => {
    it("should ingest mock news data with default count", async () => {
      mockNewsDataIngestionService.fetchAndIngestMockData.mockResolvedValue([])
      await controller.ingestMockNewsData()
      expect(mockNewsDataIngestionService.fetchAndIngestMockData).toHaveBeenCalledWith(5)
    })

    it("should ingest mock news data with custom count", async () => {
      mockNewsDataIngestionService.fetchAndIngestMockData.mockResolvedValue([])
      await controller.ingestMockNewsData("15")
      expect(mockNewsDataIngestionService.fetchAndIngestMockData).toHaveBeenCalledWith(15)
    })
  })

  describe("getOverallNarrativeSummary", () => {
    it("should return overall narrative summary", async () => {
      const summary = { totalNarratives: 5, trendingNarratives: 2, emergingNarratives: 1, topNarratives: [] }
      mockNarrativeAnalyticsService.getOverallNarrativeSummary.mockResolvedValue(summary)

      const result = await controller.getOverallNarrativeSummary()
      expect(narrativeAnalyticsService.getOverallNarrativeSummary).toHaveBeenCalled()
      expect(result).toEqual(summary)
    })
  })

  describe("getNarrativeTrends", () => {
    it("should return narrative trends", async () => {
      const trends = [{ period: "2024-01-01", narrativeName: "DeFi", totalMentions: 100 }]
      mockNarrativeAnalyticsService.getNarrativeTrends.mockResolvedValue(trends)

      const result = await controller.getNarrativeTrends("DeFi", "2024-01-01", "2024-01-07")
      expect(narrativeAnalyticsService.getNarrativeTrends).toHaveBeenCalledWith(
        "DeFi",
        expect.any(Date),
        expect.any(Date),
      )
      expect(result).toEqual(trends)
    })
  })

  describe("getTopTokensByNarrative", () => {
    it("should return top tokens by narrative with default limit", async () => {
      const tokens = [{ narrativeName: "DeFi", token: "UNI", mentions: 500 }]
      mockNarrativeAnalyticsService.getTopTokensByNarrative.mockResolvedValue(tokens)

      const result = await controller.getTopTokensByNarrative()
      expect(narrativeAnalyticsService.getTopTokensByNarrative).toHaveBeenCalledWith(10)
      expect(result).toEqual(tokens)
    })

    it("should return top tokens by narrative with custom limit", async () => {
      const tokens = [{ narrativeName: "DeFi", token: "UNI", mentions: 500 }]
      mockNarrativeAnalyticsService.getTopTokensByNarrative.mockResolvedValue(tokens)

      const result = await controller.getTopTokensByNarrative("5")
      expect(narrativeAnalyticsService.getTopTokensByNarrative).toHaveBeenCalledWith(5)
      expect(result).toEqual(tokens)
    })
  })

  describe("getSentimentBreakdown", () => {
    it("should return sentiment breakdown for a narrative", async () => {
      const breakdown = {
        narrativeName: "DeFi",
        positiveCount: 10,
        negativeCount: 2,
        neutralCount: 3,
        overallSentiment: 0.6,
      }
      mockNarrativeAnalyticsService.getSentimentBreakdown.mockResolvedValue(breakdown)

      const result = await controller.getSentimentBreakdown("DeFi")
      expect(narrativeAnalyticsService.getSentimentBreakdown).toHaveBeenCalledWith("DeFi")
      expect(result).toEqual(breakdown)
    })
  })

  describe("getNarrativeAlerts", () => {
    it("should return narrative alerts with filters", async () => {
      const alerts = [{ id: "alert-1", narrativeName: "DeFi", type: NarrativeAlertType.NEW_EMERGING_NARRATIVE }]
      mockNarrativeAlertService.getAlerts.mockResolvedValue(alerts)

      const result = await controller.getNarrativeAlerts("DeFi", "false", NarrativeAlertType.NEW_EMERGING_NARRATIVE)
      expect(narrativeAlertService.getAlerts).toHaveBeenCalledWith(
        "DeFi",
        false,
        NarrativeAlertType.NEW_EMERGING_NARRATIVE,
      )
      expect(result).toEqual(alerts)
    })
  })

  describe("markNarrativeAlertAsRead", () => {
    it("should mark a narrative alert as read", async () => {
      const alertId = "alert-1"
      const updatedAlert = { id: alertId, isRead: true }
      mockNarrativeAlertService.markAsRead.mockResolvedValue(updatedAlert)

      const result = await controller.markNarrativeAlertAsRead(alertId)
      expect(narrativeAlertService.markAsRead).toHaveBeenCalledWith(alertId)
      expect(result).toEqual(updatedAlert)
    })
  })

  describe("getUnreadNarrativeAlertCount", () => {
    it("should return unread narrative alert count", async () => {
      mockNarrativeAlertService.getUnreadCount.mockResolvedValue(5)

      const result = await controller.getUnreadNarrativeAlertCount("DeFi")
      expect(narrativeAlertService.getUnreadCount).toHaveBeenCalledWith("DeFi")
      expect(result).toEqual({ count: 5 })
    })
  })

  describe("getSocialPosts", () => {
    it("should return social posts with filters", async () => {
      const posts = [{ id: "post-1", content: "DeFi post" }]
      mockSocialDataIngestionService.getSocialPosts.mockResolvedValue(posts)

      const result = await controller.getSocialPosts("DeFi", SocialPlatform.TWITTER)
      expect(socialDataIngestionService.getSocialPosts).toHaveBeenCalledWith("DeFi", SocialPlatform.TWITTER)
      expect(result).toEqual(posts)
    })
  })

  describe("getNewsArticles", () => {
    it("should return news articles with filters", async () => {
      const articles = [{ id: "article-1", title: "DeFi News" }]
      mockNewsDataIngestionService.getNewsArticles.mockResolvedValue(articles)

      const result = await controller.getNewsArticles("DeFi", "CoinDesk")
      expect(newsDataIngestionService.getNewsArticles).toHaveBeenCalledWith("DeFi", "CoinDesk")
      expect(result).toEqual(articles)
    })
  })
})
