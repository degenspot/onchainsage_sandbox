import { Injectable, Logger } from "@nestjs/common"
import { NarrativeStatus } from "../entities/narrative.entity"
import type { NarrativeService } from "./narrative.service"
import type { SocialDataIngestionService } from "./social-data-ingestion.service"
import type { NewsDataIngestionService } from "./news-data-ingestion.service"
import type { NLPService } from "./nlp.service"
import type { NarrativeAlertService } from "./narrative-alert.service"
import { NarrativeAlertType, NarrativeAlertSeverity } from "../entities/narrative-alert.entity"

@Injectable()
export class NarrativePredictionService {
  private readonly logger = new Logger(NarrativePredictionService.name)

  constructor(
    private narrativeService: NarrativeService,
    private socialDataIngestionService: SocialDataIngestionService,
    private newsDataIngestionService: NewsDataIngestionService,
    private nlpService: NLPService,
    private narrativeAlertService: NarrativeAlertService,
  ) {}

  async runPredictionCycle(): Promise<void> {
    this.logger.log("Starting narrative prediction cycle...")

    // 1. Ingest new data (mocked for this example)
    await this.socialDataIngestionService.fetchAndIngestMockData(20)
    await this.newsDataIngestionService.fetchAndIngestMockData(10)

    // 2. Get all recent content for analysis
    const recentSocialPosts = await this.socialDataIngestionService.getSocialPosts()
    const recentNewsArticles = await this.newsDataIngestionService.getNewsArticles()

    const allContent = [
      ...recentSocialPosts.map((p) => ({ text: p.content, timestamp: p.timestamp })),
      ...recentNewsArticles.map((a) => ({ text: a.content, timestamp: a.publishedAt })),
    ]

    // 3. Identify and update narratives
    const narrativeMentions: Map<string, { sentimentSum: number; count: number; latestTimestamp: Date }> = new Map()
    const allDetectedNarratives: Set<string> = new Set()

    for (const item of allContent) {
      const detectedTopics = await this.nlpService.extractTopics(item.text)
      const sentiment = await this.nlpService.analyzeSentiment(item.text)

      for (const topic of detectedTopics) {
        allDetectedNarratives.add(topic)
        if (!narrativeMentions.has(topic)) {
          narrativeMentions.set(topic, { sentimentSum: 0, count: 0, latestTimestamp: new Date(0) })
        }
        const current = narrativeMentions.get(topic)!
        current.sentimentSum += sentiment
        current.count += 1
        if (item.timestamp > current.latestTimestamp) {
          current.latestTimestamp = item.timestamp
        }
      }
    }

    for (const narrativeName of allDetectedNarratives) {
      const stats = narrativeMentions.get(narrativeName)
      if (!stats) continue

      const averageSentiment = stats.count > 0 ? stats.sentimentSum / stats.count : 0
      const trendScore = this.calculateTrendScore(narrativeName, stats.count, stats.latestTimestamp) // Simplified

      let narrative = await this.narrativeService.findByName(narrativeName)

      if (narrative) {
        const oldSentiment = narrative.sentimentScore
        const oldTrendScore = narrative.trendScore
        const oldStatus = narrative.status

        narrative = await this.narrativeService.updateSentimentAndTrend(
          narrative.id,
          averageSentiment,
          trendScore,
          stats.latestTimestamp,
        )

        // Check for alerts
        if (narrative.status === NarrativeStatus.TRENDING && oldStatus !== NarrativeStatus.TRENDING) {
          await this.narrativeAlertService.createAlert(
            narrative.name,
            NarrativeAlertType.NARRATIVE_TRENDING_UP,
            NarrativeAlertSeverity.HIGH,
            `'${narrative.name}' is now trending!`,
            { oldStatus, newStatus: narrative.status, trendScore: narrative.trendScore },
          )
        } else if (narrative.status === NarrativeStatus.DECLINING && oldStatus !== NarrativeStatus.DECLINING) {
          await this.narrativeAlertService.createAlert(
            narrative.name,
            NarrativeAlertType.NARRATIVE_TRENDING_DOWN,
            NarrativeAlertSeverity.MEDIUM,
            `'${narrative.name}' is declining.`,
            { oldStatus, newStatus: narrative.status, trendScore: narrative.trendScore },
          )
        }

        if (Math.abs(averageSentiment - oldSentiment) > 0.3) {
          await this.narrativeAlertService.createAlert(
            narrative.name,
            NarrativeAlertType.SIGNIFICANT_SENTIMENT_SHIFT,
            NarrativeAlertSeverity.MEDIUM,
            `Significant sentiment shift for '${narrative.name}'`,
            { oldSentiment, newSentiment: averageSentiment },
          )
        }
      } else {
        // New narrative detected
        const keywords = await this.nlpService.extractKeywords(
          allContent
            .filter((c) => c.text.toLowerCase().includes(narrativeName.toLowerCase()))
            .map((c) => c.text)
            .join(" "),
        )
        const associatedTokens = this.identifyAssociatedTokens(narrativeName, allContent.map((c) => c.text).join(" ")) // Simplified
        narrative = await this.narrativeService.create({
          name: narrativeName,
          sentimentScore: averageSentiment,
          trendScore: trendScore,
          lastDetectedAt: stats.latestTimestamp,
          status: trendScore > 0.4 ? NarrativeStatus.EMERGING : NarrativeStatus.STABLE,
          keywords,
          associatedTokens,
          predictionData: { initialDetectionCount: stats.count },
        })
        await this.narrativeAlertService.createAlert(
          narrative.name,
          NarrativeAlertType.NEW_EMERGING_NARRATIVE,
          NarrativeAlertSeverity.HIGH,
          `New emerging narrative detected: '${narrative.name}'`,
          { trendScore: narrative.trendScore, sentimentScore: narrative.sentimentScore },
        )
      }
      this.logger.debug(
        `Processed narrative: ${narrative.name}, Status: ${narrative.status}, Trend: ${narrative.trendScore.toFixed(2)}, Sentiment: ${narrative.sentimentScore.toFixed(2)}`,
      )
    }

    this.logger.log("Narrative prediction cycle completed.")
  }

  private calculateTrendScore(narrativeName: string, mentionCount: number, latestTimestamp: Date): number {
    // This is a highly simplified trend score calculation.
    // In a real ML model, this would involve:
    // - Time-series analysis of mention frequency
    // - Velocity of mentions
    // - Engagement metrics (likes, retweets, comments)
    // - Comparison to historical baseline
    // - Feature engineering from NLP outputs (e.g., topic coherence, novelty)
    // - A trained machine learning model (e.g., LSTM, Prophet, XGBoost)

    const timeDecayFactor = 1 - (Date.now() - latestTimestamp.getTime()) / (7 * 24 * 60 * 60 * 1000) // Decay over 7 days
    const baseScore = Math.min(1, mentionCount / 50) // Max score 1 for 50+ mentions in this cycle
    return Math.max(0, Math.min(1, baseScore * Math.max(0, timeDecayFactor)))
  }

  private identifyAssociatedTokens(narrativeName: string, content: string): string[] {
    // Simplified token association: look for common crypto tickers in content related to the narrative
    const tokens = new Set<string>()
    const lowerContent = content.toLowerCase()

    const tokenMap: { [key: string]: string[] } = {
      defi: ["eth", "uni", "aave", "comp", "link", "mkr"],
      nfts: ["eth", "flow", "axs", "sand", "mana", "ape"],
      "layer 2": ["eth", "op", "arb", "matic", "zksync"],
      "ai crypto": ["fet", "rndr", "agix", "grt"],
      "privacy coins": ["xmr", "zec", "dash"],
      "web3 gaming": ["axs", "gala", "imx", "enj"],
      bitcoin: ["btc"],
      "ethereum ecosystem": ["eth", "uni", "link", "aave"],
      "decentralized social": ["degen", "friend", "lens"],
      "real world assets": ["mkr", "comp", "ondo"],
      "solana ecosystem": ["sol", "pyth", "jup"],
      "institutional adoption": ["btc", "eth", "sol"],
    }

    const narrativeTokens = tokenMap[narrativeName.toLowerCase()] || []
    for (const token of narrativeTokens) {
      if (lowerContent.includes(`$${token.toLowerCase()}`) || lowerContent.includes(token.toLowerCase())) {
        tokens.add(token.toUpperCase())
      }
    }
    return Array.from(tokens)
  }
}
