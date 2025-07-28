import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import { type WhaleAlert, WhaleAlertType, WhaleAlertSeverity } from "../entities/whale-alert.entity"
import type { WhaleTransaction } from "../entities/whale-transaction.entity"
import type { WhaleAlertQueryDto } from "../dto/whale-analytics.dto"

@Injectable()
export class WhaleAlertService {
  private readonly logger = new Logger(WhaleAlertService.name)
  private whaleAlertRepository: Repository<WhaleAlert>

  constructor(whaleAlertRepository: Repository<WhaleAlert>) {
    this.whaleAlertRepository = whaleAlertRepository
  }

  async createLargeTransferAlert(transaction: WhaleTransaction): Promise<WhaleAlert> {
    const alert = this.whaleAlertRepository.create({
      type: WhaleAlertType.LARGE_TRANSFER,
      severity: WhaleAlertSeverity.HIGH,
      blockchain: transaction.blockchain,
      title: `Large Transfer Detected: ${transaction.amountUSD.toLocaleString()} USD of ${transaction.assetSymbol}`,
      description: `A significant transfer of ${transaction.amount.toLocaleString()} ${transaction.assetSymbol} (${transaction.amountUSD.toLocaleString()} USD) occurred on ${transaction.blockchain} from ${transaction.fromAddress} to ${transaction.toAddress}.`,
      data: {
        transactionHash: transaction.transactionHash,
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        assetSymbol: transaction.assetSymbol,
        amount: transaction.amount,
        amountUSD: transaction.amountUSD,
        timestamp: transaction.timestamp,
      },
    })
    this.logger.log(`Created large transfer alert for ${transaction.transactionHash}`)
    return this.whaleAlertRepository.save(alert)
  }

  // Placeholder for other alert types (e.g., liquidity shifts, unusual activity)
  async createLiquidityShiftAlert(
    blockchain: string,
    assetSymbol: string,
    details: Record<string, any>,
  ): Promise<WhaleAlert> {
    const alert = this.whaleAlertRepository.create({
      type: WhaleAlertType.LIQUIDITY_SHIFT,
      severity: WhaleAlertSeverity.MEDIUM,
      blockchain,
      title: `Potential Liquidity Shift for ${assetSymbol} on ${blockchain}`,
      description: `Detected unusual liquidity movement for ${assetSymbol}. Details: ${JSON.stringify(details)}`,
      data: details,
    })
    return this.whaleAlertRepository.save(alert)
  }

  async getAlerts(query: WhaleAlertQueryDto): Promise<WhaleAlert[]> {
    const where: any = {}
    if (query.type) where.type = query.type
    if (query.severity) where.severity = query.severity
    if (query.blockchain) where.blockchain = query.blockchain
    if (query.isRead !== undefined) where.isRead = query.isRead

    return this.whaleAlertRepository.find({
      where,
      order: { createdAt: "DESC" },
    })
  }

  async markAlertAsRead(id: string): Promise<WhaleAlert> {
    await this.whaleAlertRepository.update(id, { isRead: true })
    return this.whaleAlertRepository.findOne({ where: { id } })
  }

  async getUnreadAlertCount(query: WhaleAlertQueryDto): Promise<number> {
    const where: any = { isRead: false }
    if (query.type) where.type = query.type
    if (query.severity) where.severity = query.severity
    if (query.blockchain) where.blockchain = query.blockchain

    return this.whaleAlertRepository.count({ where })
  }
}
