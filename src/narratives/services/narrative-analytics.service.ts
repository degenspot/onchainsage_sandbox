import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import { type Narrative, NarrativeStatus } from "../entities/narrative.entity"
import type { SocialPost } from "../entities/social-post.entity"
import type { NewsArticle } from "../entities/news-article.entity"
import type { NarrativeTrendDto, SentimentBreakdownDto, TopTokensByNarrativeDto } from "../dto/narrative-analytics.dto"

@Injectable()
export class NarrativeAnalyticsService {
  private readonly logger = new Logger(NarrativeAnalyticsService.name)

  constructor(
    private narrativeRepository: Repository<Narrative>,
    private socialPostRepository: Repository<SocialPost>,
    private newsArticleRepository: Repository<NewsArticle>,
  ) {}

  async getOverallNarrativeSummary() {
    const totalNarratives = await this.narrativeRepository.count()
    const trendingNarratives = await this.narrativeRepository.count({
      where: { status: NarrativeStatus.TRENDING },
    })
    const emergingNarratives = await this.narrativeRepository.count({
      where: { status: NarrativeStatus.EMERGING },
    })

    const topNarratives = await this.narrativeRepository.find({
      order: { trendScore: "DESC" },
      take: 5,
    })

    return {
      totalNarratives,
      trendingNarratives,
      emergingNarratives,
      topNarratives: topNarratives.map((n) => ({
        name: n.name,
        trendScore: n.trendScore,
        sentimentScore: n.sentimentScore,
        status: n.status,
      })),
    }
  }

  async getNarrativeTrends(narrativeName?: string, startDate?: Date, endDate?: Date): Promise<NarrativeTrendDto[]> {
    const queryBuilder = this.socialPostRepository
      .createQueryBuilder("post")
      .select([
        "DATE_TRUNC('day', post.timestamp) as period",
        "post.detectedNarratives as narrativeName",
        "AVG(post.sentimentScore) as averageSentiment",
        "COUNT(post.id) as totalMentions",
      ])
      .where("post.detectedNarratives IS NOT NULL")

    if (narrativeName) {
      queryBuilder.andWhere(":narrativeName = ANY(post.detectedNarratives)", { narrativeName })
    }
    if (startDate && endDate) {
      queryBuilder.andWhere("post.timestamp BETWEEN :startDate AND :endDate", { startDate, endDate })
    }

    queryBuilder.groupBy("period, post.detectedNarratives").orderBy("period", "ASC").addOrderBy("totalMentions", "DESC")

    const socialTrends = await queryBuilder.getRawMany()

    // Combine with news articles (simplified, could be more robust)
    const newsQueryBuilder = this.newsArticleRepository
      .createQueryBuilder("article")
      .select([
        "DATE_TRUNC('day', article.publishedAt) as period",
        "article.detectedNarratives as narrativeName",
        "AVG(article.sentimentScore) as averageSentiment",
        "COUNT(article.id) as totalMentions",
      ])
      .where("article.detectedNarratives IS NOT NULL")

    if (narrativeName) {
      newsQueryBuilder.andWhere(":narrativeName = ANY(article.detectedNarratives)", { narrativeName })
    }
    if (startDate && endDate) {
      newsQueryBuilder.andWhere("article.publishedAt BETWEEN :startDate AND :endDate", { startDate, endDate })
    }

    newsQueryBuilder
      .groupBy("period, article.detectedNarratives")
      .orderBy("period", "ASC")
      .addOrderBy("totalMentions", "DESC")

    const newsTrends = await newsQueryBuilder.getRawMany()

    // Merge and calculate trend score (simplified)
    const combinedTrends: Map<string, NarrativeTrendDto> = new Map()

    const processTrendData = (data: any[], source: string) => {
      data.forEach((row) => {
        const period = row.period.toISOString().split("T")[0]
        const narratives = row.narrativeName // This will be an array of strings

        if (narratives && Array.isArray(narratives)) {
          narratives.forEach((narName) => {
            const key = `${period}-${narName}`
            if (!combinedTrends.has(key)) {
              combinedTrends.set(key, {
                period: period,
                narrativeName: narName,
                averageSentiment: 0,
                averageTrendScore: 0, // Will be calculated later
                totalMentions: 0,
              })
            }
            const trend = combinedTrends.get(key)!
            trend.averageSentiment =
              (trend.averageSentiment * trend.totalMentions +
                Number.parseFloat(row.averageSentiment) * Number.parseInt(row.totalMentions)) /
              (trend.totalMentions + Number.parseInt(row.totalMentions))
            trend.totalMentions += Number.parseInt(row.totalMentions)
          })
        }
      })
    }

    processTrendData(socialTrends, "social")
    processTrendData(newsTrends, "news")

    // Calculate averageTrendScore based on totalMentions (simplified)
    Array.from(combinedTrends.values()).forEach((trend) => {
      trend.averageTrendScore = Math.min(1, trend.totalMentions / 100) // Max score 1 for 100+ mentions
    })

    return Array.from(combinedTrends.values()).sort((a, b) => {
      if (a.period !== b.period) return a.period.localeCompare(b.period)
      return b.totalMentions - a.totalMentions
    })
  }

  async getTopTokensByNarrative(limit = 10): Promise<TopTokensByNarrativeDto[]> {
    const narratives = await this.narrativeRepository.find({
      where: { associatedTokens: true }, // Only narratives with associated tokens
      order: { trendScore: "DESC" },
      take: limit,
    })

    const topTokens: TopTokensByNarrativeDto[] = []
    for (const narrative of narratives) {
      if (narrative.associatedTokens && narrative.associatedTokens.length > 0) {
        for (const token of narrative.associatedTokens) {
          // This is a simplified count. In a real app, you'd query social posts/news articles
          // to count actual mentions of the token within the context of this narrative.
          const mentions = Math.floor(Math.random() * 500) + 50 // Mock mentions
          topTokens.push({
            narrativeName: narrative.name,
            token: token,
            mentions: mentions,
            averageSentiment: narrative.sentimentScore,
          })
        }
      }
    }

    return topTokens.sort((a, b) => b.mentions - a.mentions).slice(0, limit)
  }

  async getSentimentBreakdown(narrativeName: string): Promise<SentimentBreakdownDto> {
    const socialPosts = await this.socialPostRepository.find({
      where: { detectedNarratives: narrativeName },
    })
    const newsArticles = await this.newsArticleRepository.find({
      where: { detectedNarratives: narrativeName },
    })

    const allContent = [...socialPosts, ...newsArticles]
    if (allContent.length === 0) {
      return {
        narrativeName,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        overallSentiment: 0,
      }
    }

    let positiveCount = 0
    let negativeCount = 0
    let neutralCount = 0
    let sentimentSum = 0

    for (const item of allContent) {
      if (item.sentimentScore !== null) {
        sentimentSum += item.sentimentScore
        if (item.sentimentScore > 0.1) {
          positiveCount++
        } else if (item.sentimentScore < -0.1) {
          negativeCount++
        } else {
          neutralCount++
        }
      }
    }

    return {
      narrativeName,
      positiveCount,
      negativeCount,
      neutralCount,
      overallSentiment: sentimentSum / allContent.length,
    }
  }
}
