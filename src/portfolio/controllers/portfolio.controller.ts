import { Controller, Get, Post, Param, Query, Put, Delete } from "@nestjs/common"
import type { UserPortfolioService } from "../services/user-portfolio.service"
import type { AIRebalancerService } from "../services/ai-rebalancer.service"
import type { RebalancingSimulationService } from "../services/rebalancing-simulation.service"
import type { WalletIntegrationService } from "../services/wallet-integration.service"
import type { MarketDataService } from "../services/market-data.service"
import type { SocialSentimentService } from "../services/social-sentiment.service"
import type { CreateUserPortfolioDto, UpdateUserPortfolioDto } from "../dto/create-user-portfolio.dto"
import type { AddPortfolioAssetDto } from "../dto/add-portfolio-asset.dto"
import type { RebalancePortfolioDto, SimulateRebalanceDto } from "../dto/rebalance-portfolio.dto"
import { SuggestionStatus } from "../entities/rebalancing-suggestion.entity"

@Controller("portfolio")
export class PortfolioController {
  constructor(
    private userPortfolioService: UserPortfolioService,
    private aiRebalancerService: AIRebalancerService,
    private rebalancingSimulationService: RebalancingSimulationService,
    private walletIntegrationService: WalletIntegrationService,
    private marketDataService: MarketDataService,
    private socialSentimentService: SocialSentimentService,
  ) {}

  // --- Portfolio Management ---
  @Post()
  async createPortfolio(createPortfolioDto: CreateUserPortfolioDto) {
    return this.userPortfolioService.createPortfolio(createPortfolioDto)
  }

  @Get(":id")
  async getPortfolio(@Param("id") id: string) {
    return this.userPortfolioService.findPortfolioById(id)
  }

  @Get("user/:userId")
  async getPortfolioByUserId(@Param("userId") userId: string) {
    return this.userPortfolioService.findPortfolioByUserId(userId)
  }

  @Put(":id")
  async updatePortfolio(@Param("id") id: string, updatePortfolioDto: UpdateUserPortfolioDto) {
    return this.userPortfolioService.updatePortfolio(id, updatePortfolioDto)
  }

  @Post(":id/assets")
  async addAssetToPortfolio(@Param("id") portfolioId: string, addAssetDto: AddPortfolioAssetDto) {
    return this.userPortfolioService.addAssetToPortfolio(portfolioId, addAssetDto)
  }

  @Delete(":id/assets/:symbol")
  async removeAssetFromPortfolio(@Param("id") portfolioId: string, @Param("symbol") symbol: string) {
    await this.userPortfolioService.removeAssetFromPortfolio(portfolioId, symbol)
    return { message: `Asset ${symbol} removed from portfolio ${portfolioId}` }
  }

  @Put(":id/assets/:symbol/price")
  async updateAssetPrice(@Param("id") portfolioId: string, @Param("symbol") symbol: string, newPriceUSD: number) {
    return this.userPortfolioService.updateAssetPrice(portfolioId, symbol, newPriceUSD)
  }

  // --- Wallet Integration & Sync ---
  @Post(":id/sync-wallet")
  async syncWallet(@Param("id") portfolioId: string) {
    const portfolio = await this.userPortfolioService.findPortfolioById(portfolioId)
    if (!portfolio.walletAddress) {
      return { message: "Wallet address not configured for this portfolio." }
    }

    const walletAssets = await this.walletIntegrationService.fetchWalletAssets(portfolio.walletAddress)

    // For simplicity, this sync will replace existing assets.
    // A more robust sync would reconcile differences (add new, update existing, remove missing).
    for (const asset of portfolio.assets) {
      await this.userPortfolioService.removeAssetFromPortfolio(portfolioId, asset.symbol)
    }

    for (const walletAsset of walletAssets) {
      await this.userPortfolioService.addAssetToPortfolio(portfolioId, walletAsset as AddPortfolioAssetDto)
    }

    await this.userPortfolioService.updatePortfolioSummary(portfolio)
    return this.userPortfolioService.findPortfolioById(portfolioId)
  }

  // --- AI Rebalancing Suggestions ---
  @Post(":id/rebalance/suggest")
  async generateRebalancingSuggestion(@Param("id") portfolioId: string) {
    const portfolio = await this.userPortfolioService.findPortfolioById(portfolioId)
    return this.aiRebalancerService.generateRebalancingSuggestion(portfolio)
  }

  @Get(":id/rebalance/suggestions")
  async getRebalancingSuggestions(@Param("id") portfolioId: string) {
    return this.aiRebalancerService.getSuggestionsForPortfolio(portfolioId)
  }

  @Put("rebalance/suggestions/:suggestionId/status")
  async updateSuggestionStatus(@Param("suggestionId") suggestionId: string, status: SuggestionStatus) {
    return this.aiRebalancerService.updateSuggestionStatus(suggestionId, status)
  }

  // --- Rebalancing Simulation ---
  @Post(":id/rebalance/simulate")
  async simulateRebalance(@Param("id") portfolioId: string, simulateDto: SimulateRebalanceDto) {
    const portfolio = await this.userPortfolioService.findPortfolioById(portfolioId)
    return this.rebalancingSimulationService.simulateRebalance(portfolio, simulateDto)
  }

  @Get(":id/rebalance/simulations")
  async getRebalancingSimulations(@Param("id") portfolioId: string) {
    return this.rebalancingSimulationService.getSimulationsForPortfolio(portfolioId)
  }

  // --- Execute Rebalance (Mock) ---
  @Post(":id/rebalance/execute")
  async executeRebalance(@Param("id") portfolioId: string, rebalanceDto: RebalancePortfolioDto) {
    const portfolio = await this.userPortfolioService.findPortfolioById(portfolioId)
    if (!portfolio.walletAddress) {
      return { success: false, message: "Wallet address not configured for this portfolio." }
    }

    const success = await this.walletIntegrationService.executeRebalance(
      portfolio.walletAddress,
      rebalanceDto.actions[0],
    ) // Simplified for single action
    if (success) {
      // After successful execution, update portfolio assets and summary
      await this.syncWallet(portfolioId) // Re-sync to reflect changes
      if (rebalanceDto.suggestionId) {
        await this.aiRebalancerService.updateSuggestionStatus(rebalanceDto.suggestionId, SuggestionStatus.ACCEPTED)
      }
      return { success: true, message: "Rebalance executed and portfolio synced." }
    } else {
      return { success: false, message: "Rebalance execution failed." }
    }
  }

  // --- Analytics & Data ---
  @Get("analytics/summary/:id")
  async getPortfolioSummary(@Param("id") portfolioId: string) {
    return this.userPortfolioService.getPortfolioSummary(portfolioId)
  }

  @Get("analytics/assets/:id")
  async getAssetPerformance(@Param("id") portfolioId: string) {
    return this.userPortfolioService.getAssetPerformance(portfolioId)
  }

  @Get("market-trends/latest")
  async getLatestMarketTrend(@Query("assetSymbol") assetSymbol?: string, @Query("sector") sector?: string) {
    return this.marketDataService.getLatestMarketTrend(assetSymbol, sector)
  }

  @Get("social-sentiment/latest")
  async getLatestSocialSentiment(@Query("assetSymbol") assetSymbol: string) {
    return this.socialSentimentService.getLatestSocialSentiment(assetSymbol)
  }
}
