import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Narrative } from "./entities/narrative.entity"
import { SocialPost } from "./entities/social-post.entity"
import { NewsArticle } from "./entities/news-article.entity"
import { NarrativeAlert } from "./entities/narrative-alert.entity"
import { NarrativeService } from "./services/narrative.service"
import { SocialDataIngestionService } from "./services/social-data-ingestion.service"
import { NewsDataIngestionService } from "./services/news-data-ingestion.service"
import { NLPService } from "./services/nlp.service"
import { NarrativePredictionService } from "./services/narrative-prediction.service"
import { NarrativeAlertService } from "./services/narrative-alert.service"
import { NarrativeAnalyticsService } from "./services/narrative-analytics.service"
import { NarrativeController } from "./controllers/narrative.controller"

@Module({
  imports: [TypeOrmModule.forFeature([Narrative, SocialPost, NewsArticle, NarrativeAlert])],
  controllers: [NarrativeController],
  providers: [
    NarrativeService,
    SocialDataIngestionService,
    NewsDataIngestionService,
    NLPService,
    NarrativePredictionService,
    NarrativeAlertService,
    NarrativeAnalyticsService,
  ],
  exports: [
    NarrativeService,
    SocialDataIngestionService,
    NewsDataIngestionService,
    NLPService,
    NarrativePredictionService,
    NarrativeAlertService,
    NarrativeAnalyticsService,
  ],
})
export class NarrativeModule {}
