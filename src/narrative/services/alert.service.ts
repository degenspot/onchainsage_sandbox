import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Narrative } from '../models/narrative.model';

@Injectable()
export class AlertService {
  constructor(private eventEmitter: EventEmitter2) {}

  checkForAlerts(newNarrative: Narrative, previousState?: Narrative) {
    if (!previousState) {
      this.emitNewNarrativeAlert(newNarrative);
      return;
    }

    if (newNarrative.stage !== previousState.stage) {
      this.emitStageChangeAlert(newNarrative, previousState.stage);
    }

    if (newNarrative.momentumScore > 70 && previousState.momentumScore <= 70) {
      this.emitHighMomentumAlert(newNarrative);
    }
  }

  private emitNewNarrativeAlert(narrative: Narrative) {
    this.eventEmitter.emit('narrative.new', {
      narrative: narrative.name,
      keywords: narrative.keywords,
      momentum: narrative.momentumScore,
    });
  }

  private emitStageChangeAlert(narrative: Narrative, previousStage: string) {
    this.eventEmitter.emit('narrative.stageChange', {
      narrative: narrative.name,
      from: previousStage,
      to: narrative.stage,
      momentum: narrative.momentumScore,
    });
  }

  private emitHighMomentumAlert(narrative: Narrative) {
    this.eventEmitter.emit('narrative.highMomentum', {
      narrative: narrative.name,
      score: narrative.momentumScore,
      stage: narrative.stage,
    });
  }
}