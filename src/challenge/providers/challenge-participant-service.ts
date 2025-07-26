// src/challenges/providers/challenge-participant.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChallengeParticipant } from '../entities/participant.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ChallengeParticipantService {
  constructor(
    @InjectRepository(ChallengeParticipant)
    private readonly repo: Repository<ChallengeParticipant>
  ) {}

  async joinChallenge(userId: string, challengeId: string) {
    const participation = this.repo.create({
      user: { id: userId },
      challenge: { id: challengeId },
    });
    return this.repo.save(participation);
  }

  async getLeaderboard(challengeId: string) {
    return this.repo.find({
      where: { challenge: { id: challengeId } },
      order: { progress: 'DESC' },
      relations: ['user'],
    });
  }
}