import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { UserPortfolio } from "./entities/user-portfolio.entity"
import { PortfolioAsset } from "./entities/portfolio-asset.entity"
import { RebalancingSuggestion } from "./entities/rebalancing-suggestion.entity"
import { RebalancingSimulation } from "./entities/rebalancing-simulation.entity"
import { MarketTrend } from "./entities/market-trend.entity"
import { SocialSentiment } from "./entities/social-sentiment.entity"
import { UserPortfolioService } from "./services/user-portfolio.service"
import { MarketDataService } from "./services/market-data.service"
import { SocialSentimentService } from "./services/social-sentiment.service"
import { AIRebalancerService } from "./services/ai-rebalancer.service"
import { RebalancingSimulationService } from "./services/rebalancing-simulation.service"
import { WalletIntegrationService } from "./services/wallet-integration.service"
import { PortfolioController } from "./controllers/portfolio.controller"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserPortfolio,
      PortfolioAsset,
      RebalancingSuggestion,
      RebalancingSimulation,
      MarketTrend,
      SocialSentiment,
    ]),
  ],
  controllers: [PortfolioController],
  providers: [
    UserPortfolioService,
    MarketDataService,
    SocialSentimentService,
    AIRebalancerService,
    RebalancingSimulationService,
    WalletIntegrationService,
  ],
  exports: [
    UserPortfolioService,
    MarketDataService,
    SocialSentimentService,
    AIRebalancerService,
    RebalancingSimulationService,
    WalletIntegrationService,
  ],
})
export class PortfolioModule {}
