import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { SocialSentiment } from "../entities/social-sentiment.entity"

@Injectable()
export class SocialSentimentService {
  private readonly logger = new Logger(SocialSentimentService.name)
  private socialSentimentRepository: Repository<SocialSentiment>

  constructor(socialSentimentRepository: Repository<SocialSentiment>) {
    this.socialSentimentRepository = socialSentimentRepository
  }

  async fetchAndStoreMockSocialSentiment(): Promise<SocialSentiment[]> {
    this.logger.log("Fetching and storing mock social sentiment data...")
    const sentiments: SocialSentiment[] = []

    const mockSentimentData = [
      {
        assetSymbol: "BTC",
        sentimentScore: 0.6,
        source: "twitter",
        summary: "High positive sentiment for Bitcoin on Twitter.",
      },
      {
        assetSymbol: "ETH",
        sentimentScore: 0.4,
        source: "reddit",
        summary: "Ethereum discussions are generally positive on Reddit.",
      },
      {
        assetSymbol: "SOL",
        sentimentScore: -0.2,
        source: "twitter",
        summary: "Mixed to slightly negative sentiment for Solana.",
      },
      {
        assetSymbol: "ADA",
        sentimentScore: -0.5,
        source: "news",
        summary: "Negative news coverage impacting Cardano sentiment.",
      },
      { assetSymbol: "DOGE", sentimentScore: 0.8, source: "twitter", summary: "Strong meme coin hype." },
    ]

    for (const data of mockSentimentData) {
      const sentiment = this.socialSentimentRepository.create({
        ...data,
        timestamp: new Date(),
      })
      sentiments.push(await this.socialSentimentRepository.save(sentiment))
    }
    this.logger.log(`Stored ${sentiments.length} mock social sentiments.`)
    return sentiments
  }

  async getLatestSocialSentiment(assetSymbol: string): Promise<SocialSentiment | null> {
    return this.socialSentimentRepository.findOne({
      where: { assetSymbol },
      order: { timestamp: "DESC" },
    })
  }

  async getSocialSentimentHistory(assetSymbol: string, limit = 100): Promise<SocialSentiment[]> {
    return this.socialSentimentRepository.find({
      where: { assetSymbol },
      order: { timestamp: "DESC" },
      take: limit,
    })
  }
}
