import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeParticipant } from './entities/participant.entity';
import { Challenge } from './entities/challenge.entity';
import { ChallengeService } from './providers/challenge.service';
import { ChallengeParticipantService } from './providers/challenge-participant-service';
import { ChallengeController } from './challenge.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ChallengeParticipant, Challenge])],
    providers: [ChallengeService, ChallengeParticipantService],
    controllers: [ChallengeController]
})
export class ChallengeModule {}
