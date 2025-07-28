import { Injectable, NotFoundException, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import { type Narrative, NarrativeStatus } from "../entities/narrative.entity"
import type { CreateNarrativeDto } from "../dto/create-narrative.dto"
import type { NarrativeQueryDto } from "../dto/narrative-analytics.dto"

@Injectable()
export class NarrativeService {
  private readonly logger = new Logger(NarrativeService.name)

  constructor(private narrativeRepository: Repository<Narrative>) {}

  async create(createNarrativeDto: CreateNarrativeDto): Promise<Narrative> {
    const narrative = this.narrativeRepository.create({
      ...createNarrativeDto,
      lastDetectedAt: createNarrativeDto.lastDetectedAt ? new Date(createNarrativeDto.lastDetectedAt) : new Date(),
    })
    this.logger.log(`Creating new narrative: ${narrative.name}`)
    return this.narrativeRepository.save(narrative)
  }

  async findAll(query: NarrativeQueryDto): Promise<Narrative[]> {
    const queryBuilder = this.narrativeRepository.createQueryBuilder("narrative")

    if (query.name) {
      queryBuilder.andWhere("narrative.name ILIKE :name", { name: `%${query.name}%` })
    }
    if (query.associatedTokens && query.associatedTokens.length > 0) {
      queryBuilder.andWhere("narrative.associatedTokens @> ARRAY[:...tokens]", { tokens: query.associatedTokens })
    }
    if (query.status) {
      queryBuilder.andWhere("narrative.status = :status", { status: query.status })
    }
    if (query.startDate && query.endDate) {
      queryBuilder.andWhere("narrative.lastDetectedAt BETWEEN :startDate AND :endDate", {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      })
    }
    if (query.minTrendScore !== undefined) {
      queryBuilder.andWhere("narrative.trendScore >= :minTrendScore", { minTrendScore: query.minTrendScore })
    }

    return queryBuilder.orderBy("narrative.trendScore", "DESC").getMany()
  }

  async findOne(id: string): Promise<Narrative> {
    const narrative = await this.narrativeRepository.findOne({ where: { id } })
    if (!narrative) {
      throw new NotFoundException(`Narrative with ID ${id} not found`)
    }
    return narrative
  }

  async findByName(name: string): Promise<Narrative> {
    const narrative = await this.narrativeRepository.findOne({ where: { name } })
    return narrative
  }

  async update(id: string, updateData: Partial<Narrative>): Promise<Narrative> {
    await this.narrativeRepository.update(id, updateData)
    return this.findOne(id)
  }

  async updateSentimentAndTrend(
    id: string,
    sentimentScore: number,
    trendScore: number,
    lastDetectedAt: Date,
  ): Promise<Narrative> {
    const narrative = await this.findOne(id)
    narrative.sentimentScore = sentimentScore
    narrative.trendScore = trendScore
    narrative.lastDetectedAt = lastDetectedAt
    // Update status based on trend score (simplified logic)
    if (trendScore > 0.8) {
      narrative.status = NarrativeStatus.TRENDING
    } else if (trendScore < 0.2) {
      narrative.status = NarrativeStatus.DECLINING
    } else if (trendScore > 0.4) {
      narrative.status = NarrativeStatus.EMERGING
    } else {
      narrative.status = NarrativeStatus.STABLE
    }
    this.logger.debug(
      `Updating sentiment and trend for narrative ${narrative.name}: Sentiment=${sentimentScore}, Trend=${trendScore}`,
    )
    return this.narrativeRepository.save(narrative)
  }

  async delete(id: string): Promise<void> {
    const result = await this.narrativeRepository.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException(`Narrative with ID ${id} not found`)
    }
    this.logger.log(`Deleted narrative with ID: ${id}`)
  }
}
