import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ArbitrageOpportunity } from "./entities/arbitrage-opportunity.entity"
import { ArbitrageEvent } from "./entities/arbitrage-event.entity"
import { DexPrice } from "./entities/dex-price.entity"
import { ArbitrageAlert } from "./entities/arbitrage-alert.entity"
import { DexPriceService } from "./services/dex-price.service"
import { ArbitrageFinderService } from "./services/arbitrage-finder.service"
import { ArbitrageEventService } from "./services/arbitrage-event.service"
import { ArbitrageAlertService } from "./services/arbitrage-alert.service"
import { ArbitrageAnalyticsService } from "./services/arbitrage-analytics.service"
import { ArbitrageController } from "./controllers/arbitrage.controller"

@Module({
  imports: [TypeOrmModule.forFeature([ArbitrageOpportunity, ArbitrageEvent, DexPrice, ArbitrageAlert])],
  controllers: [ArbitrageController],
  providers: [
    DexPriceService,
    ArbitrageFinderService,
    ArbitrageEventService,
    ArbitrageAlertService,
    ArbitrageAnalyticsService,
  ],
  exports: [
    DexPriceService,
    ArbitrageFinderService,
    ArbitrageEventService,
    ArbitrageAlertService,
    ArbitrageAnalyticsService,
  ],
})
export class ArbitrageModule {}
