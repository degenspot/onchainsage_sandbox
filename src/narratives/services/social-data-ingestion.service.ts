import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import { type SocialPost, SocialPlatform } from "../entities/social-post.entity"
import type { CreateSocialPostDto } from "../dto/create-social-post.dto"
import type { NLPService } from "./nlp.service"

@Injectable()
export class SocialDataIngestionService {
  private readonly logger = new Logger(SocialDataIngestionService.name)

  constructor(
    private socialPostRepository: Repository<SocialPost>,
    private nlpService: NLPService,
  ) {}

  async ingestSocialPost(dto: CreateSocialPostDto): Promise<SocialPost> {
    const existingPost = await this.socialPostRepository.findOne({
      where: { externalId: dto.externalId, platform: dto.platform },
    })

    if (existingPost) {
      this.logger.warn(`Duplicate social post detected: ${dto.externalId} on ${dto.platform}. Skipping ingestion.`)
      return existingPost
    }

    // Perform NLP analysis on the content
    const sentimentScore = await this.nlpService.analyzeSentiment(dto.content)
    const detectedNarratives = await this.nlpService.extractTopics(dto.content)

    const socialPost = this.socialPostRepository.create({
      ...dto,
      sentimentScore,
      detectedNarratives,
      timestamp: new Date(dto.timestamp),
    })

    this.logger.log(`Ingesting social post from ${dto.platform} by ${dto.authorId}`)
    return this.socialPostRepository.save(socialPost)
  }

  async fetchAndIngestMockData(count = 10): Promise<SocialPost[]> {
    this.logger.log(`Fetching and ingesting ${count} mock social posts...`)
    const mockPosts: SocialPost[] = []
    const platforms = [SocialPlatform.TWITTER, SocialPlatform.REDDIT, SocialPlatform.FORUM]
    const sampleContents = [
      "DeFi is the future! #crypto #DeFi",
      "NFTs are dead, long live GameFi. What do you think?",
      "Layer 2 solutions are scaling Ethereum. Optimism and Arbitrum are key.",
      "The next bull run will be driven by AI tokens. $FET $RNDR",
      "Privacy coins are making a comeback. Zcash and Monero are undervalued.",
      "Web3 gaming is still early, but the potential is huge.",
      "Bitcoin halving is coming soon. Price prediction anyone?",
      "Ethereum's EIP-4844 will reduce gas fees. Big news for users.",
      "Decentralized social media platforms are gaining traction.",
      "Real-world assets (RWAs) on blockchain are the next big thing.",
      "Solana ecosystem is growing rapidly. Many new projects launching.",
      "Is institutional adoption of crypto finally here?",
    ]
    const sampleTokens = [
      ["ETH", "UNI"],
      ["AXS", "SAND"],
      ["ETH", "OP", "ARB"],
      ["FET", "RNDR", "AGIX"],
      ["ZEC", "XMR"],
      ["GALA", "IMX"],
      ["BTC"],
      ["ETH"],
      ["DEGEN", "FRIEND"],
      ["MKR", "COMP"],
      ["SOL", "PYTH"],
      ["BTC", "ETH"],
    ]

    for (let i = 0; i < count; i++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)]
      const contentIndex = Math.floor(Math.random() * sampleContents.length)
      const content = sampleContents[contentIndex]
      const associatedTokens = sampleTokens[contentIndex]

      const dto: CreateSocialPostDto = {
        externalId: `mock-social-${Date.now()}-${i}`,
        authorId: `user_${Math.floor(Math.random() * 1000)}`,
        content: content,
        platform: platform,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        metadata: {
          likes: Math.floor(Math.random() * 1000),
          retweets: Math.floor(Math.random() * 200),
        },
      }
      mockPosts.push(await this.ingestSocialPost(dto))
    }
    this.logger.log(`Finished ingesting ${mockPosts.length} mock social posts.`)
    return mockPosts
  }

  async getSocialPosts(narrativeName?: string, platform?: SocialPlatform): Promise<SocialPost[]> {
    const where: any = {}
    if (narrativeName) {
      where.detectedNarratives = narrativeName
    }
    if (platform) {
      where.platform = platform
    }
    return this.socialPostRepository.find({
      where,
      order: { timestamp: "DESC" },
      take: 100, // Limit for practical purposes
    })
  }
}
