import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Token } from "./entities/token.entity"
import { OnChainMetric } from "./entities/on-chain-metric.entity"
import { SocialSentimentMetric } from "./entities/social-sentiment-metric.entity"
import { DeveloperActivityMetric } from "./entities/developer-activity-metric.entity"
import { TokenQualityScore } from "./entities/token-quality-score.entity"
import { TokenService } from "./services/token.service"
import { OnChainDataService } from "./services/on-chain-data.service"
import { SocialDataService } from "./services/social-data.service"
import { DeveloperDataService } from "./services/developer-data.service"
import { TokenQualityScoringService } from "./services/token-quality-scoring.service"
import { TokenQualityController } from "./controllers/token-quality.controller"

@Module({
  imports: [
    TypeOrmModule.forFeature([Token, OnChainMetric, SocialSentimentMetric, DeveloperActivityMetric, TokenQualityScore]),
  ],
  controllers: [TokenQualityController],
  providers: [TokenService, OnChainDataService, SocialDataService, DeveloperDataService, TokenQualityScoringService],
  exports: [TokenService, OnChainDataService, SocialDataService, DeveloperDataService, TokenQualityScoringService],
})
export class TokenQualityModule {}
