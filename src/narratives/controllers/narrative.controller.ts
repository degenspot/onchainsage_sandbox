import { Controller, Get, Post, Query, Put, Delete, HttpCode, HttpStatus } from "@nestjs/common"
import type { NarrativeService } from "../services/narrative.service"
import type { NarrativePredictionService } from "../services/narrative-prediction.service"
import type { NarrativeAlertService } from "../services/narrative-alert.service"
import type { NarrativeAnalyticsService } from "../services/narrative-analytics.service"
import type { SocialDataIngestionService } from "../services/social-data-ingestion.service"
import type { NewsDataIngestionService } from "../services/news-data-ingestion.service"
import type { CreateNarrativeDto } from "../dto/create-narrative.dto"
import type { NarrativeQueryDto } from "../dto/narrative-analytics.dto"
import type { NarrativeAlertType } from "../entities/narrative-alert.entity"
import type { CreateSocialPostDto } from "../dto/create-social-post.dto"
import type { CreateNewsArticleDto } from "../dto/create-news-article.dto"
import type { SocialPlatform } from "../entities/social-post.entity"

@Controller("narratives")
export class NarrativeController {
  constructor(
    private narrativeService: NarrativeService,
    private narrativePredictionService: NarrativePredictionService,
    private narrativeAlertService: NarrativeAlertService,
    private narrativeAnalyticsService: NarrativeAnalyticsService,
    private socialDataIngestionService: SocialDataIngestionService,
    private newsDataIngestionService: NewsDataIngestionService,
  ) {}

  // --- Narrative Management Endpoints ---
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createNarrative(createNarrativeDto: CreateNarrativeDto) {
    return this.narrativeService.create(createNarrativeDto)
  }

  @Get()
  async getNarratives(query: NarrativeQueryDto) {
    return this.narrativeService.findAll(query)
  }

  @Get(":id")
  async getNarrativeById(id: string) {
    return this.narrativeService.findOne(id)
  }

  @Put(":id")
  async updateNarrative(id: string, updateData: Partial<CreateNarrativeDto>) {
    return this.narrativeService.update(id, updateData)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNarrative(id: string) {
    await this.narrativeService.delete(id)
  }

  // --- Data Ingestion Endpoints (for external systems to push data) ---
  @Post("ingest/social")
  @HttpCode(HttpStatus.CREATED)
  async ingestSocialPost(createSocialPostDto: CreateSocialPostDto) {
    return this.socialDataIngestionService.ingestSocialPost(createSocialPostDto)
  }

  @Post("ingest/news")
  @HttpCode(HttpStatus.CREATED)
  async ingestNewsArticle(createNewsArticleDto: CreateNewsArticleDto) {
    return this.newsDataIngestionService.ingestNewsArticle(createNewsArticleDto)
  }

  // --- Prediction Engine Endpoints ---
  @Post("run-prediction-cycle")
  @HttpCode(HttpStatus.OK)
  async runPredictionCycle() {
    await this.narrativePredictionService.runPredictionCycle()
    return { message: "Narrative prediction cycle initiated." }
  }

  @Post("ingest/mock-social-data")
  @HttpCode(HttpStatus.CREATED)
  async ingestMockSocialData(@Query('count') count: string = '10') {
    const numCount = Number.parseInt(count, 10);
    return this.socialDataIngestionService.fetchAndIngestMockData(numCount);
  }

  @Post("ingest/mock-news-data")
  @HttpCode(HttpStatus.CREATED)
  async ingestMockNewsData(@Query('count') count: string = '5') {
    const numCount = Number.parseInt(count, 10);
    return this.newsDataIngestionService.fetchAndIngestMockData(numCount);
  }

  // --- Analytics Endpoints ---
  @Get("analytics/summary")
  async getOverallNarrativeSummary() {
    return this.narrativeAnalyticsService.getOverallNarrativeSummary()
  }

  @Get("analytics/trends")
  async getNarrativeTrends(
    @Query("narrativeName") narrativeName?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.narrativeAnalyticsService.getNarrativeTrends(
      narrativeName,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    )
  }

  @Get("analytics/top-tokens")
  async getTopTokensByNarrative(@Query("limit") limit: string = "10") {
    return this.narrativeAnalyticsService.getTopTokensByNarrative(Number.parseInt(limit, 10))
  }

  @Get("analytics/sentiment-breakdown/:narrativeName")
  async getSentimentBreakdown(narrativeName: string) {
    return this.narrativeAnalyticsService.getSentimentBreakdown(narrativeName)
  }

  // --- Alert Endpoints ---
  @Get("alerts")
  async getNarrativeAlerts(
    @Query("narrativeName") narrativeName?: string,
    @Query("isRead") isRead?: string,
    @Query("type") type?: NarrativeAlertType,
  ) {
    return this.narrativeAlertService.getAlerts(narrativeName, isRead ? isRead === "true" : undefined, type)
  }

  @Put("alerts/:id/read")
  async markNarrativeAlertAsRead(id: string) {
    return this.narrativeAlertService.markAsRead(id)
  }

  @Get("alerts/unread-count")
  async getUnreadNarrativeAlertCount(@Query("narrativeName") narrativeName?: string) {
    const count = await this.narrativeAlertService.getUnreadCount(narrativeName)
    return { count }
  }

  // --- Raw Data Access (for debugging/advanced analytics) ---
  @Get("data/social-posts")
  async getSocialPosts(@Query("narrativeName") narrativeName?: string, @Query("platform") platform?: SocialPlatform) {
    return this.socialDataIngestionService.getSocialPosts(narrativeName, platform)
  }

  @Get("data/news-articles")
  async getNewsArticles(@Query("narrativeName") narrativeName?: string, @Query("source") source?: string) {
    return this.newsDataIngestionService.getNewsArticles(narrativeName, source)
  }
}
