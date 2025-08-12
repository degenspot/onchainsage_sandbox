import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import type { TokenAnalyticsService } from "./token-analytics.service"
import type { BlockchainDataService } from "../blockchain/blockchain-data.service"
import type { Repository } from "typeorm"
import { InjectRepository } from "@nestjs/typeorm"
import { Token } from "../../entities/token.entity"

@Injectable()
export class AnalyticsAggregatorService {
  private readonly logger = new Logger(AnalyticsAggregatorService.name);

  constructor(
    private tokenAnalyticsService: TokenAnalyticsService,
    private blockchainDataService: BlockchainDataService,
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
  ) {}

  // Run every 5 minutes to update analytics
  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateAllTokenAnalytics(): Promise<void> {
    this.logger.log("Starting scheduled analytics update...")

    try {
      const activeTokens = await this.tokenRepository.find({
        where: { isActive: true },
        relations: ["blockchain"],
      })

      this.logger.log(`Found ${activeTokens.length} active tokens to update`)

      // Process tokens in batches to avoid overwhelming external APIs
      const batchSize = 10
      for (let i = 0; i < activeTokens.length; i += batchSize) {
        const batch = activeTokens.slice(i, i + batchSize)

        await Promise.allSettled(
          batch.map(async (token) => {
            try {
              await this.blockchainDataService.syncTokenAnalytics(token.id)
              this.logger.debug(`Updated analytics for token ${token.symbol}`)
            } catch (error) {
              this.logger.error(`Failed to update analytics for token ${token.symbol}:`, error)
            }
          }),
        )

        // Add delay between batches to respect rate limits
        if (i + batchSize < activeTokens.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }

      this.logger.log("Completed scheduled analytics update")
    } catch (error) {
      this.logger.error("Failed to update analytics:", error)
    }
  }

  // Run every hour to update transaction data
  @Cron(CronExpression.EVERY_HOUR)
  async updateTransactionData(): Promise<void> {
    this.logger.log("Starting scheduled transaction data update...")

    try {
      const activeTokens = await this.tokenRepository.find({
        where: { isActive: true },
        relations: ["blockchain"],
      })

      for (const token of activeTokens) {
        try {
          await this.blockchainDataService.syncTokenTransactions(token.id, 100)
          this.logger.debug(`Updated transactions for token ${token.symbol}`)
        } catch (error) {
          this.logger.error(`Failed to update transactions for token ${token.symbol}:`, error)
        }

        // Add delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      this.logger.log("Completed scheduled transaction data update")
    } catch (error) {
      this.logger.error("Failed to update transaction data:", error)
    }
  }

  // Run every 6 hours to update holder data
  @Cron("0 */6 * * *")
  async updateHolderData(): Promise<void> {
    this.logger.log("Starting scheduled holder data update...")

    try {
      const activeTokens = await this.tokenRepository.find({
        where: { isActive: true },
        relations: ["blockchain"],
      })

      for (const token of activeTokens) {
        try {
          await this.blockchainDataService.syncTokenHolders(token.id, 1000)
          this.logger.debug(`Updated holders for token ${token.symbol}`)
        } catch (error) {
          this.logger.error(`Failed to update holders for token ${token.symbol}:`, error)
        }

        // Add delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      this.logger.log("Completed scheduled holder data update")
    } catch (error) {
      this.logger.error("Failed to update holder data:", error)
    }
  }

  async forceUpdateToken(tokenId: string): Promise<void> {
    try {
      this.logger.log(`Force updating token ${tokenId}`)

      await Promise.all([
        this.blockchainDataService.syncTokenAnalytics(tokenId),
        this.blockchainDataService.syncTokenTransactions(tokenId, 100),
        this.blockchainDataService.syncTokenHolders(tokenId, 1000),
      ])

      this.logger.log(`Successfully force updated token ${tokenId}`)
    } catch (error) {
      this.logger.error(`Failed to force update token ${tokenId}:`, error)
      throw error
    }
  }
}
