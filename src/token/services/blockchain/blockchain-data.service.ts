import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { Token } from "../../entities/token.entity"
import type { TokenAnalytics } from "../../entities/token-analytics.entity"
import type { TokenTransaction } from "../../entities/token-transaction.entity"
import type { TokenHolder } from "../../entities/token-holder.entity"
import type { BlockchainFactoryService } from "./blockchain-factory.service"

@Injectable()
export class BlockchainDataService {
  private readonly logger = new Logger(BlockchainDataService.name)

  constructor(
    private blockchainFactory: BlockchainFactoryService,
    private tokenRepository: Repository<Token>,
    private analyticsRepository: Repository<TokenAnalytics>,
    private transactionRepository: Repository<TokenTransaction>,
    private holderRepository: Repository<TokenHolder>,
  ) {}

  async syncTokenData(chainId: string, contractAddress: string): Promise<Token> {
    try {
      const blockchainService = await this.blockchainFactory.getBlockchainService(chainId)

      // Fetch token data from blockchain
      const tokenData = await blockchainService.getTokenData(contractAddress)

      // Find or create token in database
      let token = await this.tokenRepository.findOne({
        where: { contractAddress, blockchain: { chainId } },
        relations: ["blockchain"],
      })

      if (!token) {
        // Create new token
        const blockchain = await this.tokenRepository.manager.findOne("Blockchain", {
          where: { chainId },
        })

        if (!blockchain) {
          throw new Error(`Blockchain with chainId ${chainId} not found`)
        }

        token = this.tokenRepository.create({
          ...tokenData,
          blockchain,
        })
      } else {
        // Update existing token
        Object.assign(token, tokenData)
      }

      return await this.tokenRepository.save(token)
    } catch (error) {
      this.logger.error(`Failed to sync token data for ${contractAddress} on ${chainId}:`, error)
      throw error
    }
  }

  async syncTokenAnalytics(tokenId: string): Promise<TokenAnalytics> {
    try {
      const token = await this.tokenRepository.findOne({
        where: { id: tokenId },
        relations: ["blockchain"],
      })

      if (!token) {
        throw new Error(`Token with id ${tokenId} not found`)
      }

      const blockchainService = await this.blockchainFactory.getBlockchainService(token.blockchain.chainId)

      const analyticsData = await blockchainService.getTokenAnalytics(token.contractAddress)

      const analytics = this.analyticsRepository.create({
        ...analyticsData,
        token,
        timestamp: new Date(),
      })

      return await this.analyticsRepository.save(analytics)
    } catch (error) {
      this.logger.error(`Failed to sync analytics for token ${tokenId}:`, error)
      throw error
    }
  }

  async syncTokenTransactions(tokenId: string, limit = 100): Promise<void> {
    try {
      const token = await this.tokenRepository.findOne({
        where: { id: tokenId },
        relations: ["blockchain"],
      })

      if (!token) {
        throw new Error(`Token with id ${tokenId} not found`)
      }

      const blockchainService = await this.blockchainFactory.getBlockchainService(token.blockchain.chainId)

      const transactions = await blockchainService.getTokenTransactions(token.contractAddress, limit)

      for (const txData of transactions) {
        // Check if transaction already exists
        const existingTx = await this.transactionRepository.findOne({
          where: { transactionHash: txData.hash },
        })

        if (!existingTx) {
          const transaction = this.transactionRepository.create({
            transactionHash: txData.hash,
            fromAddress: txData.from,
            toAddress: txData.to,
            amount: txData.amount,
            valueUsd: txData.valueUsd,
            type: txData.type,
            blockNumber: txData.blockNumber,
            timestamp: txData.timestamp,
            gasUsed: txData.gasUsed,
            gasPrice: txData.gasPrice,
            token,
          })

          await this.transactionRepository.save(transaction)
        }
      }
    } catch (error) {
      this.logger.error(`Failed to sync transactions for token ${tokenId}:`, error)
      throw error
    }
  }

  async syncTokenHolders(tokenId: string, limit = 1000): Promise<void> {
    try {
      const token = await this.tokenRepository.findOne({
        where: { id: tokenId },
        relations: ["blockchain"],
      })

      if (!token) {
        throw new Error(`Token with id ${tokenId} not found`)
      }

      const blockchainService = await this.blockchainFactory.getBlockchainService(token.blockchain.chainId)

      const holders = await blockchainService.getTokenHolders(token.contractAddress, limit)

      for (const holderData of holders) {
        // Find or create holder
        let holder = await this.holderRepository.findOne({
          where: { address: holderData.address, token: { id: tokenId } },
        })

        if (!holder) {
          holder = this.holderRepository.create({
            address: holderData.address,
            balance: holderData.balance,
            percentage: holderData.percentage,
            transactionCount: holderData.transactionCount,
            firstTransactionAt: holderData.firstTransactionAt,
            lastTransactionAt: holderData.lastTransactionAt,
            token,
          })
        } else {
          // Update existing holder
          holder.balance = holderData.balance
          holder.percentage = holderData.percentage
          holder.transactionCount = holderData.transactionCount
          holder.lastTransactionAt = holderData.lastTransactionAt
        }

        await this.holderRepository.save(holder)
      }
    } catch (error) {
      this.logger.error(`Failed to sync holders for token ${tokenId}:`, error)
      throw error
    }
  }
}
