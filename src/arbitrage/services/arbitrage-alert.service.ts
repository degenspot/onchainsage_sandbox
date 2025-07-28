import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { ArbitrageAlert, ArbitrageAlertType, ArbitrageAlertSeverity } from "../entities/arbitrage-alert.entity"
import type { ArbitrageOpportunity } from "../entities/arbitrage-opportunity.entity"

@Injectable()
export class ArbitrageAlertService {
  private readonly logger = new Logger(ArbitrageAlertService.name)
  private arbitrageAlertRepository: Repository<ArbitrageAlert>

  constructor(arbitrageAlertRepository: Repository<ArbitrageAlert>) {
    this.arbitrageAlertRepository = arbitrageAlertRepository
  }

  async createArbitrageAlert(
    opportunity: ArbitrageOpportunity,
    type: ArbitrageAlertType,
    severity: ArbitrageAlertSeverity,
    title: string,
    description: string,
  ): Promise<ArbitrageAlert> {
    const alert = this.arbitrageAlertRepository.create({
      opportunityId: opportunity.id,
      type,
      severity,
      title,
      description,
      data: {
        opportunityId: opportunity.id,
        tokenPair: opportunity.tokenPair,
        chain1: opportunity.chain1,
        dex1: opportunity.dex1,
        price1: opportunity.price1,
        chain2: opportunity.chain2,
        dex2: opportunity.dex2,
        price2: opportunity.price2,
        priceDifferencePercentage: opportunity.priceDifferencePercentage,
        potentialProfitUSD: opportunity.potentialProfitUSD,
      },
    })
    this.logger.log(`Created arbitrage alert: ${title} (Severity: ${severity})`)
    return this.arbitrageAlertRepository.save(alert)
  }

  async getAlerts(
    type?: ArbitrageAlertType,
    severity?: ArbitrageAlertSeverity,
    isRead?: boolean,
  ): Promise<ArbitrageAlert[]> {
    const where: any = {}
    if (type) where.type = type
    if (severity) where.severity = severity
    if (isRead !== undefined) where.isRead = isRead

    return this.arbitrageAlertRepository.find({
      where,
      order: { createdAt: "DESC" },
    })
  }

  async markAlertAsRead(id: string): Promise<ArbitrageAlert> {
    await this.arbitrageAlertRepository.update(id, { isRead: true })
    const updatedAlert = await this.arbitrageAlertRepository.findOne({ where: { id } })
    if (!updatedAlert) {
      this.logger.warn(`Alert with ID ${id} not found for marking as read.`)
    }
    return updatedAlert
  }

  async getUnreadAlertCount(type?: ArbitrageAlertType, severity?: ArbitrageAlertSeverity): Promise<number> {
    const where: any = { isRead: false }
    if (type) where.type = type
    if (severity) where.severity = severity

    return this.arbitrageAlertRepository.count({ where })
  }
}
