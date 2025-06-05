import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NarrativeController } from './controllers/narrative.controller';
import { ExtractionService } from './services/extraction.service';
import { MomentumService } from './services/momentum.service';
import { TrackingService } from './services/tracking.service';
import { AlertService } from './services/alert.service';
import { CorrelationService } from './services/correlation.service';
import { Narrative, NarrativeSchema } from './models/narrative.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Narrative.name, schema: NarrativeSchema }]),
    HttpModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [NarrativeController],
  providers: [
    ExtractionService,
    MomentumService,
    TrackingService,
    AlertService,
    CorrelationService,
  ],
})
export class NarrativeModule {}