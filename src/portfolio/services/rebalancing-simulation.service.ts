import { Injectable, Logger, NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { RebalancingSimulation } from "../entities/rebalancing-simulation.entity"
import type { UserPortfolio } from "../entities/user-portfolio.entity"
import type { SimulateRebalanceDto } from "../dto/rebalance-portfolio.dto"

@Injectable()
export class RebalancingSimulationService {
  private readonly logger = new Logger(RebalancingSimulationService.name)
  private rebalancingSimulationRepository: Repository<RebalancingSimulation>

  constructor(rebalancingSimulationRepository: Repository<RebalancingSimulation>) {
    this.rebalancingSimulationRepository = rebalancingSimulationRepository
  }

  async simulateRebalance(portfolio: UserPortfolio, simulateDto: SimulateRebalanceDto): Promise<RebalancingSimulation> {
    this.logger.log(`Simulating rebalance for portfolio ${portfolio.id}`)

    // Create a deep copy of the current portfolio state for simulation
    const initialPortfolioState = {
      totalValueUSD: Number(portfolio.totalValueUSD),
      assets: portfolio.assets.map((asset) => ({
        symbol: asset.symbol,
        quantity: Number(asset.quantity),
        currentPriceUSD: Number(asset.currentPriceUSD),
        valueUSD: Number(asset.valueUSD),
      })),
    }

    let simulatedTotalValueUSD = initialPortfolioState.totalValueUSD
    const simulatedAssets: Record<string, { quantity: number; valueUSD: number; currentPriceUSD: number }> = {}

    // Initialize simulated assets from initial state
    initialPortfolioState.assets.forEach((asset) => {
      simulatedAssets[asset.symbol] = {
        quantity: asset.quantity,
        valueUSD: asset.valueUSD,
        currentPriceUSD: asset.currentPriceUSD,
      }
    })

    let projectedProfitLossUSD = 0 // Represents fees/slippage in a real scenario

    // Apply simulated actions
    for (const action of simulateDto.actions) {
      const asset = simulatedAssets[action.symbol] || { quantity: 0, valueUSD: 0, currentPriceUSD: 0 }
      const currentPrice =
        asset.currentPriceUSD || portfolio.assets.find((a) => a.symbol === action.symbol)?.currentPriceUSD || 1 // Fallback price

      if (action.type === "buy") {
        const quantityToBuy = currentPrice > 0 ? action.amountUSD / currentPrice : 0
        asset.quantity += quantityToBuy
        asset.valueUSD += action.amountUSD
        simulatedTotalValueUSD += action.amountUSD
        projectedProfitLossUSD -= action.amountUSD * 0.001 // Mock 0.1% buy fee
      } else if (action.type === "sell") {
        const quantityToSell = currentPrice > 0 ? action.amountUSD / currentPrice : 0
        if (asset.quantity >= quantityToSell) {
          asset.quantity -= quantityToSell
          asset.valueUSD -= action.amountUSD
          simulatedTotalValueUSD -= action.amountUSD
          projectedProfitLossUSD -= action.amountUSD * 0.001 // Mock 0.1% sell fee
        } else {
          this.logger.warn(`Attempted to sell more ${action.symbol} than available in simulation.`)
          // Sell all available
          projectedProfitLossUSD -= asset.valueUSD * 0.001
          simulatedTotalValueUSD -= asset.valueUSD
          asset.quantity = 0
          asset.valueUSD = 0
        }
      }
      simulatedAssets[action.symbol] = asset
    }

    // Calculate final allocation and deviation
    const finalPortfolioState = {
      totalValueUSD: simulatedTotalValueUSD,
      assets: Object.values(simulatedAssets).map((asset) => ({
        symbol: asset.symbol,
        quantity: asset.quantity,
        currentPriceUSD: asset.currentPriceUSD,
        valueUSD: asset.valueUSD,
      })),
    }

    let totalDeviation = 0
    if (portfolio.targetAllocation && simulatedTotalValueUSD > 0) {
      for (const symbol in portfolio.targetAllocation) {
        const targetPct = portfolio.targetAllocation[symbol]
        const finalAssetValue = simulatedAssets[symbol]?.valueUSD || 0
        const finalPct = finalAssetValue / simulatedTotalValueUSD
        totalDeviation += Math.abs(finalPct - targetPct)
      }
    }
    const projectedTargetDeviation = totalDeviation * 100 // Convert to percentage

    const simulation = this.rebalancingSimulationRepository.create({
      portfolio,
      initialPortfolioState,
      simulatedActions: simulateDto.actions,
      finalPortfolioState,
      projectedProfitLossUSD,
      projectedTargetDeviation,
      notes: simulateDto.notes,
      simulatedAt: new Date(),
    })

    return this.rebalancingSimulationRepository.save(simulation)
  }

  async getSimulationsForPortfolio(portfolioId: string): Promise<RebalancingSimulation[]> {
    return this.rebalancingSimulationRepository.find({
      where: { portfolioId },
      order: { simulatedAt: "DESC" },
    })
  }

  async getSimulationById(id: string): Promise<RebalancingSimulation> {
    const simulation = await this.rebalancingSimulationRepository.findOne({ where: { id } })
    if (!simulation) {
      throw new NotFoundException(`Rebalancing simulation with ID ${id} not found`)
    }
    return simulation
  }
}
