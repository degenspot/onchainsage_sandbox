import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { WhaleTransaction } from "../entities/whale-transaction.entity"
import type { CreateWhaleTransactionDto } from "../dto/create-whale-transaction.dto"
import type { WhaleAnalyticsQueryDto } from "../dto/whale-analytics.dto"
import type { WhaleAlertService } from "./whale-alert.service"

@Injectable()
export class WhaleTransactionService {
  private readonly logger = new Logger(WhaleTransactionService.name)
  private whaleTransactionRepository: Repository<WhaleTransaction>
  private WHALE_THRESHOLD_USD = 1000000 // $1,000,000 USD

  constructor(
    whaleTransactionRepository: Repository<WhaleTransaction>,
    private whaleAlertService: WhaleAlertService,
  ) {
    this.whaleTransactionRepository = whaleTransactionRepository
  }

  async processAndSaveTransaction(createTxDto: CreateWhaleTransactionDto): Promise<WhaleTransaction> {
    const isWhale = createTxDto.amountUSD >= this.WHALE_THRESHOLD_USD

    const transaction = this.whaleTransactionRepository.create({
      ...createTxDto,
      isWhaleTransaction: isWhale,
      timestamp: createTxDto.timestamp ? new Date(createTxDto.timestamp) : new Date(),
    })

    try {
      const savedTx = await this.whaleTransactionRepository.save(transaction)
      this.logger.log(
        `Processed transaction ${savedTx.transactionHash}: ${savedTx.amountUSD.toLocaleString()} USD. Is Whale: ${isWhale}`,
      )

      if (isWhale) {
        await this.whaleAlertService.createLargeTransferAlert(savedTx)
      }
      return savedTx
    } catch (error) {
      if (error.code === "23505") {
        // Duplicate key error (transactionHash already exists)
        this.logger.warn(`Duplicate transaction hash detected: ${createTxDto.transactionHash}. Skipping save.`)
        // Optionally, fetch and return the existing transaction
        return this.whaleTransactionRepository.findOne({ where: { transactionHash: createTxDto.transactionHash } })
      }
      throw error
    }
  }

  async findAllWhaleTransactions(query: WhaleAnalyticsQueryDto): Promise<WhaleTransaction[]> {
    const queryBuilder = this.whaleTransactionRepository.createQueryBuilder("tx")
    queryBuilder.where("tx.isWhaleTransaction = :isWhale", { isWhale: true })

    if (query.blockchain) {
      queryBuilder.andWhere("tx.blockchain = :blockchain", { blockchain: query.blockchain })
    }
    if (query.blockchains && query.blockchains.length > 0) {
      queryBuilder.andWhere("tx.blockchain IN (:...blockchains)", { blockchains: query.blockchains })
    }
    if (query.assetSymbol) {
      queryBuilder.andWhere("tx.assetSymbol = :assetSymbol", { assetSymbol: query.assetSymbol })
    }
    if (query.assetSymbols && query.assetSymbols.length > 0) {
      queryBuilder.andWhere("tx.assetSymbol IN (:...assetSymbols)", { assetSymbols: query.assetSymbols })
    }
    if (query.startDate && query.endDate) {
      queryBuilder.andWhere("tx.timestamp BETWEEN :startDate AND :endDate", {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      })
    }
    if (query.minAmountUSD) {
      queryBuilder.andWhere("tx.amountUSD >= :minAmountUSD", { minAmountUSD: query.minAmountUSD })
    }
    if (query.address) {
      queryBuilder.andWhere("(tx.fromAddress = :address OR tx.toAddress = :address)", { address: query.address })
    }

    return queryBuilder.orderBy("tx.timestamp", "DESC").getMany()
  }

  async getWhaleTransactionCount(query: WhaleAnalyticsQueryDto): Promise<number> {
    const queryBuilder = this.whaleTransactionRepository.createQueryBuilder("tx")
    queryBuilder.where("tx.isWhaleTransaction = :isWhale", { isWhale: true })

    if (query.blockchain) {
      queryBuilder.andWhere("tx.blockchain = :blockchain", { blockchain: query.blockchain })
    }
    if (query.assetSymbol) {
      queryBuilder.andWhere("tx.assetSymbol = :assetSymbol", { assetSymbol: query.assetSymbol })
    }
    if (query.startDate && query.endDate) {
      queryBuilder.andWhere("tx.timestamp BETWEEN :startDate AND :endDate", {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      })
    }

    return queryBuilder.getCount()
  }
}
