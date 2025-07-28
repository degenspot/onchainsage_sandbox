import { Injectable, NotFoundException, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { UserPortfolio } from "../entities/user-portfolio.entity"
import type { PortfolioAsset } from "../entities/portfolio-asset.entity"
import type { CreateUserPortfolioDto, UpdateUserPortfolioDto } from "../dto/create-user-portfolio.dto"
import type { AddPortfolioAssetDto } from "../dto/add-portfolio-asset.dto"
import type { PortfolioAnalyticsQueryDto } from "../dto/portfolio-analytics.dto"

@Injectable()
export class UserPortfolioService {
  private readonly logger = new Logger(UserPortfolioService.name)
  private userPortfolioRepository: Repository<UserPortfolio>
  private portfolioAssetRepository: Repository<PortfolioAsset>

  constructor(
    userPortfolioRepository: Repository<UserPortfolio>,
    portfolioAssetRepository: Repository<PortfolioAsset>,
  ) {
    this.userPortfolioRepository = userPortfolioRepository
    this.portfolioAssetRepository = portfolioAssetRepository
  }

  async createPortfolio(createPortfolioDto: CreateUserPortfolioDto): Promise<UserPortfolio> {
    const portfolio = this.userPortfolioRepository.create(createPortfolioDto)
    return this.userPortfolioRepository.save(portfolio)
  }

  async findPortfolioById(id: string): Promise<UserPortfolio> {
    const portfolio = await this.userPortfolioRepository.findOne({
      where: { id },
      relations: ["assets"],
    })
    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${id} not found`)
    }
    return portfolio
  }

  async findPortfolioByUserId(userId: string): Promise<UserPortfolio> {
    const portfolio = await this.userPortfolioRepository.findOne({
      where: { userId },
      relations: ["assets"],
    })
    if (!portfolio) {
      throw new NotFoundException(`Portfolio for user ${userId} not found`)
    }
    return portfolio
  }

  async updatePortfolio(id: string, updatePortfolioDto: UpdateUserPortfolioDto): Promise<UserPortfolio> {
    await this.userPortfolioRepository.update(id, updatePortfolioDto)
    return this.findPortfolioById(id)
  }

  async addAssetToPortfolio(portfolioId: string, addAssetDto: AddPortfolioAssetDto): Promise<PortfolioAsset> {
    const portfolio = await this.findPortfolioById(portfolioId)
    const existingAsset = portfolio.assets.find((a) => a.symbol === addAssetDto.symbol)

    if (existingAsset) {
      // Update existing asset
      existingAsset.quantity += addAssetDto.quantity
      existingAsset.currentPriceUSD = addAssetDto.currentPriceUSD
      existingAsset.valueUSD = existingAsset.quantity * existingAsset.currentPriceUSD
      // Recalculate average cost if needed, or keep it simple
      existingAsset.averageCostUSD =
        (existingAsset.averageCostUSD * (existingAsset.quantity - addAssetDto.quantity) +
          addAssetDto.averageCostUSD * addAssetDto.quantity) /
        existingAsset.quantity
      existingAsset.profitLossPercentage =
        ((existingAsset.currentPriceUSD - existingAsset.averageCostUSD) / existingAsset.averageCostUSD) * 100
      await this.portfolioAssetRepository.save(existingAsset)
      await this.updatePortfolioSummary(portfolio)
      return existingAsset
    } else {
      // Create new asset
      const newAsset = this.portfolioAssetRepository.create({
        ...addAssetDto,
        portfolio,
        valueUSD: addAssetDto.quantity * addAssetDto.currentPriceUSD,
        profitLossPercentage:
          ((addAssetDto.currentPriceUSD - addAssetDto.averageCostUSD) / addAssetDto.averageCostUSD) * 100,
      })
      await this.portfolioAssetRepository.save(newAsset)
      await this.updatePortfolioSummary(portfolio)
      return newAsset
    }
  }

  async removeAssetFromPortfolio(portfolioId: string, assetSymbol: string): Promise<void> {
    const portfolio = await this.findPortfolioById(portfolioId)
    const assetToRemove = portfolio.assets.find((a) => a.symbol === assetSymbol)

    if (!assetToRemove) {
      throw new NotFoundException(`Asset ${assetSymbol} not found in portfolio ${portfolioId}`)
    }

    await this.portfolioAssetRepository.remove(assetToRemove)
    await this.updatePortfolioSummary(portfolio)
  }

  async updateAssetPrice(portfolioId: string, symbol: string, newPriceUSD: number): Promise<PortfolioAsset> {
    const portfolio = await this.findPortfolioById(portfolioId)
    const asset = portfolio.assets.find((a) => a.symbol === symbol)

    if (!asset) {
      throw new NotFoundException(`Asset ${symbol} not found in portfolio ${portfolioId}`)
    }

    asset.currentPriceUSD = newPriceUSD
    asset.valueUSD = asset.quantity * newPriceUSD
    asset.profitLossPercentage = ((newPriceUSD - asset.averageCostUSD) / asset.averageCostUSD) * 100

    await this.portfolioAssetRepository.save(asset)
    await this.updatePortfolioSummary(portfolio)
    return asset
  }

  async updatePortfolioSummary(portfolio: UserPortfolio): Promise<UserPortfolio> {
    const assets = await this.portfolioAssetRepository.find({ where: { portfolioId: portfolio.id } })
    const oldTotalValue = portfolio.totalValueUSD
    const newTotalValue = assets.reduce((sum, asset) => sum + Number(asset.valueUSD), 0)

    portfolio.totalValueUSD = newTotalValue
    portfolio.totalProfitLossUSD = assets.reduce(
      (sum, asset) => sum + Number(asset.valueUSD) - Number(asset.quantity) * Number(asset.averageCostUSD),
      0,
    )

    if (oldTotalValue > 0) {
      portfolio.dailyProfitLossPercentage = ((newTotalValue - oldTotalValue) / oldTotalValue) * 100
    } else {
      portfolio.dailyProfitLossPercentage = 0
    }

    portfolio.lastSyncedAt = new Date()
    return this.userPortfolioRepository.save(portfolio)
  }

  async getPortfolioSummary(portfolioId: string): Promise<any> {
    const portfolio = await this.findPortfolioById(portfolioId)
    const currentAllocation: Record<string, number> = {}
    portfolio.assets.forEach((asset) => {
      currentAllocation[asset.symbol] = Number(asset.valueUSD) / Number(portfolio.totalValueUSD)
    })

    return {
      totalValueUSD: Number(portfolio.totalValueUSD),
      totalProfitLossUSD: Number(portfolio.totalProfitLossUSD),
      dailyProfitLossPercentage: Number(portfolio.dailyProfitLossPercentage),
      currentAllocation,
      targetAllocation: portfolio.targetAllocation,
      riskProfile: portfolio.riskProfile,
      lastSyncedAt: portfolio.lastSyncedAt,
    }
  }

  async getAssetPerformance(portfolioId: string): Promise<PortfolioAsset[]> {
    const portfolio = await this.findPortfolioById(portfolioId)
    return portfolio.assets
  }

  async getPortfolios(query: PortfolioAnalyticsQueryDto): Promise<UserPortfolio[]> {
    const queryBuilder = this.userPortfolioRepository.createQueryBuilder("portfolio")
    queryBuilder.leftJoinAndSelect("portfolio.assets", "assets")

    if (query.userId) {
      queryBuilder.andWhere("portfolio.userId = :userId", { userId: query.userId })
    }
    if (query.portfolioId) {
      queryBuilder.andWhere("portfolio.id = :portfolioId", { portfolioId: query.portfolioId })
    }
    if (query.riskProfile) {
      queryBuilder.andWhere("portfolio.riskProfile = :riskProfile", { riskProfile: query.riskProfile })
    }
    if (query.startDate && query.endDate) {
      queryBuilder.andWhere("portfolio.createdAt BETWEEN :startDate AND :endDate", {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      })
    }
    if (query.symbols && query.symbols.length > 0) {
      queryBuilder.andWhere("assets.symbol IN (:...symbols)", { symbols: query.symbols })
    }

    return queryBuilder.getMany()
  }
}
