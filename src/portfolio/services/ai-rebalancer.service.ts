import { Injectable, Logger, NotFoundException } from "@nestjs/common"
import type { UserPortfolio } from "../entities/user-portfolio.entity"
import {
  type RebalancingSuggestion,
  RebalancingActionType,
  type RebalancingAction,
  SuggestionStatus,
} from "../entities/rebalancing-suggestion.entity"
import type { MarketDataService } from "./market-data.service"
import type { SocialSentimentService } from "./social-sentiment.service"
import type { Repository } from "typeorm"
import { TrendType } from "../entities/market-trend.entity"

@Injectable()
export class AIRebalancerService {
  private readonly logger = new Logger(AIRebalancerService.name)
  private rebalancingSuggestionRepository: Repository<RebalancingSuggestion>

  constructor(
    rebalancingSuggestionRepository: Repository<RebalancingSuggestion>,
    private marketDataService: MarketDataService,
    private socialSentimentService: SocialSentimentService,
  ) {
    this.rebalancingSuggestionRepository = rebalancingSuggestionRepository
  }

  async generateRebalancingSuggestion(portfolio: UserPortfolio): Promise<RebalancingSuggestion | null> {
    this.logger.log(`Generating rebalancing suggestion for portfolio ${portfolio.id}`)

    if (!portfolio.targetAllocation || Object.keys(portfolio.targetAllocation).length === 0) {
      this.logger.warn(`Portfolio ${portfolio.id} has no target allocation. Cannot generate suggestion.`)
      return null
    }

    const currentAllocation: Record<string, number> = {}
    portfolio.assets.forEach((asset) => {
      currentAllocation[asset.symbol] = Number(asset.valueUSD) / Number(portfolio.totalValueUSD)
    })

    const actions: RebalancingAction[] = []
    let estimatedImpactUSD = 0
    let reasoning = "Based on your target allocation, current market trends, and social sentiment:\n"

    // 1. Identify deviations from target allocation
    for (const symbol in portfolio.targetAllocation) {
      const targetPct = portfolio.targetAllocation[symbol]
      const currentPct = currentAllocation[symbol] || 0
      const deviation = currentPct - targetPct

      const asset = portfolio.assets.find((a) => a.symbol === symbol)
      const currentPrice = asset?.currentPriceUSD || 0

      if (Math.abs(deviation) > 0.01) {
        // Significant deviation (e.g., > 1%)
        const amountUSD = Math.abs(deviation) * Number(portfolio.totalValueUSD)
        const quantity = currentPrice > 0 ? amountUSD / Number(currentPrice) : 0

        const marketTrend = await this.marketDataService.getLatestMarketTrend(symbol)
        const socialSentiment = await this.socialSentimentService.getLatestSocialSentiment(symbol)

        let actionType: RebalancingActionType
        let actionReason = ""

        if (deviation > 0) {
          // Over-allocated, suggest selling
          actionType = RebalancingActionType.SELL
          actionReason = `You are over-allocated in ${symbol} by ${(deviation * 100).toFixed(2)}%.`
          if (marketTrend?.trendType === TrendType.BEARISH && marketTrend.strength > 0.5) {
            actionReason += ` Market trend for ${symbol} is bearish.`
          }
          if (socialSentiment?.sentimentScore < -0.3) {
            actionReason += ` Social sentiment for ${symbol} is negative.`
          }
        } else {
          // Under-allocated, suggest buying
          actionType = RebalancingActionType.BUY
          actionReason = `You are under-allocated in ${symbol} by ${(-deviation * 100).toFixed(2)}%.`
          if (marketTrend?.trendType === TrendType.BULLISH && marketTrend.strength > 0.5) {
            actionReason += ` Market trend for ${symbol} is bullish.`
          }
          if (socialSentiment?.sentimentScore > 0.3) {
            actionReason += ` Social sentiment for ${symbol} is positive.`
          }
        }

        // Adjust amount based on risk profile and market/sentiment (simplified)
        let adjustedAmountUSD = amountUSD
        if (portfolio.riskProfile === RiskProfile.CONSERVATIVE) {
          // Conservative: prioritize strict rebalancing, less market speculation
          adjustedAmountUSD = amountUSD * 0.8 // Be more cautious
        } else if (portfolio.riskProfile === RiskProfile.AGGRESSIVE) {
          // Aggressive: might lean into trends more
          if (
            (actionType === RebalancingActionType.BUY &&
              marketTrend?.trendType === TrendType.BULLISH &&
              marketTrend.strength > 0.5) ||
            (actionType === RebalancingActionType.SELL &&
              marketTrend?.trendType === TrendType.BEARISH &&
              marketTrend.strength > 0.5)
          ) {
            adjustedAmountUSD = amountUSD * 1.2 // Lean into strong trends
          }
        }

        actions.push({
          type: actionType,
          symbol,
          amountUSD: adjustedAmountUSD,
          quantity: currentPrice > 0 ? adjustedAmountUSD / Number(currentPrice) : 0,
          reason: actionReason,
        })
        estimatedImpactUSD += adjustedAmountUSD // Sum of absolute amounts for impact
        reasoning += `- ${actionType.toUpperCase()} ${adjustedAmountUSD.toFixed(2)} USD of ${symbol}. ${actionReason}\n`
      }
    }

    if (actions.length === 0) {
      reasoning =
        "Your portfolio is well-balanced and aligns with your target allocation. No rebalancing needed at this time."
      this.logger.log(`No rebalancing needed for portfolio ${portfolio.id}.`)
      return null
    }

    const suggestion = this.rebalancingSuggestionRepository.create({
      portfolio,
      actions,
      estimatedImpactUSD,
      reasoning,
      suggestedAt: new Date(),
    })

    return this.rebalancingSuggestionRepository.save(suggestion)
  }

  async getSuggestionsForPortfolio(portfolioId: string): Promise<RebalancingSuggestion[]> {
    return this.rebalancingSuggestionRepository.find({
      where: { portfolioId },
      order: { suggestedAt: "DESC" },
    })
  }

  async getSuggestionById(id: string): Promise<RebalancingSuggestion> {
    const suggestion = await this.rebalancingSuggestionRepository.findOne({ where: { id } })
    if (!suggestion) {
      throw new NotFoundException(`Rebalancing suggestion with ID ${id} not found`)
    }
    return suggestion
  }

  async updateSuggestionStatus(id: string, status: SuggestionStatus): Promise<RebalancingSuggestion> {
    await this.rebalancingSuggestionRepository.update(id, {
      status,
      acceptedAt: status === SuggestionStatus.ACCEPTED ? new Date() : null,
    })
    return this.getSuggestionById(id)
  }
}
