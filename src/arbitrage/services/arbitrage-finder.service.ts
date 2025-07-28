import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { ArbitrageOpportunity } from "../entities/arbitrage-opportunity.entity"
import type { DexPrice } from "../entities/dex-price.entity"
import type { DexPriceService } from "./dex-price.service"
import type { ArbitrageAlertService } from "./arbitrage-alert.service"
import { ArbitrageAlertType, ArbitrageAlertSeverity } from "../entities/arbitrage-alert.entity"

@Injectable()
export class ArbitrageFinderService {
  private readonly logger = new Logger(ArbitrageFinderService.name)
  private arbitrageOpportunityRepository: Repository<ArbitrageOpportunity>

  constructor(
    arbitrageOpportunityRepository: Repository<ArbitrageOpportunity>,
    private dexPriceService: DexPriceService,
    private arbitrageAlertService: ArbitrageAlertService,
  ) {
    this.arbitrageOpportunityRepository = arbitrageOpportunityRepository
  }

  async scanForOpportunities(
    minPriceDifferencePercentage = 0.5, // 0.5%
    minPotentialProfitUSD = 100,
  ): Promise<ArbitrageOpportunity[]> {
    this.logger.log("Scanning for arbitrage opportunities...")
    const latestPrices = await this.dexPriceService.getLatestPrices()
    const opportunities: ArbitrageOpportunity[] = []

    // Group prices by token symbol
    const pricesByToken: Map<string, DexPrice[]> = new Map()
    for (const price of latestPrices) {
      if (!pricesByToken.has(price.tokenSymbol)) {
        pricesByToken.set(price.tokenSymbol, [])
      }
      pricesByToken.get(price.tokenSymbol)!.push(price)
    }

    for (const [tokenSymbol, tokenPrices] of pricesByToken.entries()) {
      // Compare prices for the same token across different DEXs/chains
      for (let i = 0; i < tokenPrices.length; i++) {
        for (let j = i + 1; j < tokenPrices.length; j++) {
          const price1 = tokenPrices[i]
          const price2 = tokenPrices[j]

          // Ensure we are comparing different DEXs or chains
          if (
            (price1.chain === price2.chain && price1.dex === price2.dex) ||
            price1.tokenSymbol !== price2.tokenSymbol
          ) {
            continue
          }

          const priceDiff = Math.abs(price1.price - price2.price)
          const avgPrice = (price1.price + price2.price) / 2
          const priceDifferencePercentage = (priceDiff / avgPrice) * 100

          if (priceDifferencePercentage >= minPriceDifferencePercentage) {
            // Assume a fixed amount for potential profit calculation for simplicity
            // In a real scenario, this would involve liquidity, gas fees, and trade size.
            const assumedTradeSizeUSD = 10000 // Example trade size
            const potentialProfitUSD = (assumedTradeSizeUSD * priceDifferencePercentage) / 100

            if (potentialProfitUSD >= minPotentialProfitUSD) {
              const opportunity = this.arbitrageOpportunityRepository.create({
                tokenPair: `${price1.tokenSymbol}/USDC`, // Assuming USDC as base for profit calc
                chain1: price1.chain,
                dex1: price1.dex,
                price1: price1.price,
                chain2: price2.chain,
                dex2: price2.dex,
                price2: price2.price,
                priceDifferencePercentage: priceDifferencePercentage,
                potentialProfitUSD: potentialProfitUSD,
                isActive: true,
                metadata: {
                  price1Liquidity: price1.liquidity,
                  price2Liquidity: price2.liquidity,
                },
              })
              const savedOpportunity = await this.arbitrageOpportunityRepository.save(opportunity)
              opportunities.push(savedOpportunity)

              // Create an alert for the detected opportunity
              await this.arbitrageAlertService.createArbitrageAlert(
                savedOpportunity,
                ArbitrageAlertType.HIGH_PROFIT_OPPORTUNITY,
                potentialProfitUSD >= 500 ? ArbitrageAlertSeverity.CRITICAL : ArbitrageAlertSeverity.HIGH,
                `High Profit Arbitrage: ${savedOpportunity.tokenPair} on ${savedOpportunity.chain1}/${savedOpportunity.dex1} vs ${savedOpportunity.chain2}/${savedOpportunity.dex2}`,
                `Detected ${priceDifferencePercentage.toFixed(2)}% price difference with potential profit of $${potentialProfitUSD.toFixed(2)}`,
              )
            }
          }
        }
      }
    }

    this.logger.log(`Found ${opportunities.length} new arbitrage opportunities.`)
    return opportunities
  }

  async getActiveOpportunities(): Promise<ArbitrageOpportunity[]> {
    return this.arbitrageOpportunityRepository.find({
      where: { isActive: true },
      order: { potentialProfitUSD: "DESC" },
    })
  }

  async markOpportunityAsInactive(id: string): Promise<ArbitrageOpportunity> {
    await this.arbitrageOpportunityRepository.update(id, { isActive: false })
    const updatedOpportunity = await this.arbitrageOpportunityRepository.findOne({ where: { id } })
    if (updatedOpportunity) {
      await this.arbitrageAlertService.createArbitrageAlert(
        updatedOpportunity,
        ArbitrageAlertType.OPPORTUNITY_EXPIRED,
        ArbitrageAlertSeverity.LOW,
        `Opportunity Expired: ${updatedOpportunity.tokenPair}`,
        `Arbitrage opportunity ${updatedOpportunity.id} is no longer active.`,
      )
    }
    return updatedOpportunity
  }

  async findOpportunityById(id: string): Promise<ArbitrageOpportunity> {
    return this.arbitrageOpportunityRepository.findOne({ where: { id } })
  }
}
