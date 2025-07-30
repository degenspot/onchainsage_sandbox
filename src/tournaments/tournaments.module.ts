import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from './entities/tournament.entity';
import { TournamentParticipant } from './entities/tournament-participant.entity';
import { TournamentRound } from './entities/tournament-round.entity';
import { TournamentPrediction } from './entities/tournament-prediction.entity';
import { TournamentLeaderboard } from './entities/tournament-leaderboard.entity';
import { TournamentReward } from './entities/tournament-reward.entity';
import { TournamentController } from './controllers/tournament.controller';
import { TournamentService } from './services/tournament.service';
import { TournamentParticipationService } from './services/tournament-participation.service';
import { TournamentScoringService } from './services/tournament-scoring.service';
import { TournamentLeaderboardService } from './services/tournament-leaderboard.service';
import { TournamentRewardService } from './services/tournament-reward.service';
import { TournamentAnalyticsService } from './services/tournament-analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tournament,
      TournamentParticipant,
      TournamentRound,
      TournamentPrediction,
      TournamentLeaderboard,
      TournamentReward,
    ]),
  ],
  controllers: [TournamentController],
  providers: [
    TournamentService,
    TournamentParticipationService,
    TournamentScoringService,
    TournamentLeaderboardService,
    TournamentRewardService,
    TournamentAnalyticsService,
  ],
  exports: [
    TournamentService,
    TournamentParticipationService,
    TournamentScoringService,
    TournamentLeaderboardService,
    TournamentRewardService,
    TournamentAnalyticsService,
  ],
})
export class TournamentsModule {} 