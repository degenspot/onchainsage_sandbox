import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { NarrativeAlert, NarrativeAlertType, NarrativeAlertSeverity } from "../entities/narrative-alert.entity"

@Injectable()
export class NarrativeAlertService {
  private readonly logger = new Logger(NarrativeAlertService.name)

  constructor(private narrativeAlertRepository: Repository<NarrativeAlert>) {}

  async createAlert(
    narrativeName: string,
    type: NarrativeAlertType,
    severity: NarrativeAlertSeverity,
    title: string,
    data: Record<string, any>,
  ): Promise<NarrativeAlert> {
    const alert = this.narrativeAlertRepository.create({
      narrativeName,
      type,
      severity,
      title,
      description: `Alert for narrative '${narrativeName}': ${title}`,
      data,
    })
    this.logger.warn(`New Narrative Alert: [${severity}] ${title} for ${narrativeName}`)
    return this.narrativeAlertRepository.save(alert)
  }

  async getAlerts(narrativeName?: string, isRead?: boolean, type?: NarrativeAlertType): Promise<NarrativeAlert[]> {
    const where: any = {}
    if (narrativeName) where.narrativeName = narrativeName
    if (isRead !== undefined) where.isRead = isRead
    if (type) where.type = type

    return this.narrativeAlertRepository.find({
      where,
      order: { createdAt: "DESC" },
      take: 50, // Limit for practical purposes
    })
  }

  async markAsRead(id: string): Promise<NarrativeAlert> {
    await this.narrativeAlertRepository.update(id, { isRead: true })
    const updatedAlert = await this.narrativeAlertRepository.findOne({ where: { id } })
    if (updatedAlert) {
      this.logger.log(`Marked alert ${id} as read.`)
    }
    return updatedAlert
  }

  async getUnreadCount(narrativeName?: string): Promise<number> {
    const where: any = { isRead: false }
    if (narrativeName) where.narrativeName = narrativeName
    return this.narrativeAlertRepository.count({ where })
  }
}
