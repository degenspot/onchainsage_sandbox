import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { NewsArticle } from "../entities/news-article.entity"
import type { CreateNewsArticleDto } from "../dto/create-news-article.dto"
import type { NLPService } from "./nlp.service"

@Injectable()
export class NewsDataIngestionService {
  private readonly logger = new Logger(NewsDataIngestionService.name)

  constructor(
    private newsArticleRepository: Repository<NewsArticle>,
    private nlpService: NLPService,
  ) {}

  async ingestNewsArticle(dto: CreateNewsArticleDto): Promise<NewsArticle> {
    const existingArticle = await this.newsArticleRepository.findOne({
      where: { externalId: dto.externalId, source: dto.source },
    })

    if (existingArticle) {
      this.logger.warn(`Duplicate news article detected: ${dto.externalId} from ${dto.source}. Skipping ingestion.`)
      return existingArticle
    }

    // Perform NLP analysis on the content
    const sentimentScore = await this.nlpService.analyzeSentiment(dto.content)
    const detectedNarratives = await this.nlpService.extractTopics(dto.content)

    const newsArticle = this.newsArticleRepository.create({
      ...dto,
      sentimentScore,
      detectedNarratives,
      publishedAt: new Date(dto.publishedAt),
    })

    this.logger.log(`Ingesting news article from ${dto.source}: ${dto.title}`)
    return this.newsArticleRepository.save(newsArticle)
  }

  async fetchAndIngestMockData(count = 5): Promise<NewsArticle[]> {
    this.logger.log(`Fetching and ingesting ${count} mock news articles...`)
    const mockArticles: NewsArticle[] = []
    const sampleTitles = [
      "DeFi Protocols See Record TVL Growth in Q2",
      "NFT Market Cools Down, Focus Shifts to Utility",
      "Ethereum Scaling Solutions Gain Traction Ahead of Major Upgrade",
      "AI Tokens Surge as Interest in Decentralized AI Grows",
      "Privacy-Focused Blockchains Address Regulatory Concerns",
      "Web3 Gaming: The Future of Digital Entertainment?",
      "Bitcoin Price Volatility Continues Amid Macroeconomic Uncertainty",
      "New Layer 2 Rollup Launches on Ethereum Mainnet",
      "Decentralized Social Media: A New Paradigm for Online Interaction",
      "Tokenization of Real-World Assets: Bridging TradFi and DeFi",
    ]
    const sampleContents = [
      "Decentralized finance (DeFi) platforms have experienced unprecedented growth...",
      "After a speculative frenzy, the non-fungible token (NFT) market is maturing...",
      "As Ethereum prepares for its next major upgrade, layer 2 solutions like Arbitrum and Optimism are seeing increased adoption...",
      "The convergence of artificial intelligence and blockchain technology is driving a new wave of innovation...",
      "Privacy coins are navigating a complex regulatory landscape, with discussions around AML and KYC compliance...",
      "Blockchain-based gaming is evolving rapidly, offering players true ownership of in-game assets...",
      "Bitcoin's price movements remain highly sensitive to global economic indicators and central bank policies...",
      "A new optimistic rollup, 'ZkSync Era', has launched, promising lower transaction costs and higher throughput...",
      "Decentralized social networks aim to give users more control over their data and content...",
      "The tokenization of real-world assets (RWAs) such as real estate and commodities is gaining momentum...",
    ]
    const sampleSources = ["CoinDesk", "Decrypt", "The Block", "Blockworks"]

    for (let i = 0; i < count; i++) {
      const titleIndex = Math.floor(Math.random() * sampleTitles.length)
      const dto: CreateNewsArticleDto = {
        externalId: `mock-news-${Date.now()}-${i}`,
        title: sampleTitles[titleIndex],
        content: sampleContents[titleIndex],
        url: `https://example.com/news/${i}`,
        source: sampleSources[Math.floor(Math.random() * sampleSources.length)],
        publishedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(), // Last 60 days
        metadata: {
          category: "Crypto News",
        },
      }
      mockArticles.push(await this.ingestNewsArticle(dto))
    }
    this.logger.log(`Finished ingesting ${mockArticles.length} mock news articles.`)
    return mockArticles
  }

  async getNewsArticles(narrativeName?: string, source?: string): Promise<NewsArticle[]> {
    const where: any = {}
    if (narrativeName) {
      where.detectedNarratives = narrativeName
    }
    if (source) {
      where.source = source
    }
    return this.newsArticleRepository.find({
      where,
      order: { publishedAt: "DESC" },
      take: 50, // Limit for practical purposes
    })
  }
}
