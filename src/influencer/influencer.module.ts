import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { InfluencerController } from './controllers/influencer.controller';
import { InfluencerService } from './services/influencer.service';
import { Influencer, InfluencerSchema } from './models/influencer.model';
import { ImpactMeasurementService } from './services/impact-measurement.service';
import { ScoringService } from './services/scoring.service';
import { PredictionService } from './services/prediction.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Influencer.name, schema: InfluencerSchema }]),
    HttpModule,
  ],
  controllers: [InfluencerController],
  providers: [
    InfluencerService,
    ImpactMeasurementService,
    ScoringService,
    PredictionService,
  ],
  exports: [InfluencerService],
})
export class InfluencerModule {}