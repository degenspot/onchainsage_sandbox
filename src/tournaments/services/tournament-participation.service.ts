import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament, TournamentStatus } from '../entities/tournament.entity';
import { TournamentParticipant, ParticipantStatus } from '../entities/tournament-participant.entity';
import { JoinTournamentDto } from '../dto/join-tournament.dto';

@Injectable()
export class TournamentParticipationService {
  private readonly logger = new Logger(TournamentParticipationService.name);

  constructor(
    @InjectRepository(TournamentParticipant)
    private tournamentParticipantRepository: Repository<TournamentParticipant>,
    @InjectRepository(Tournament)
    private tournamentRepository: Repository<Tournament>,
  ) {}

  async joinTournament(joinTournamentDto: JoinTournamentDto, userId: string): Promise<TournamentParticipant> {
    this.logger.log(`User ${userId} joining tournament ${joinTournamentDto.tournamentId}`);

    // Check if tournament exists and is open for registration
    const tournament = await this.tournamentRepository.findOne({
      where: { id: joinTournamentDto.tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament with ID "${joinTournamentDto.tournamentId}" not found`);
    }

    if (tournament.status !== TournamentStatus.UPCOMING) {
      throw new BadRequestException('Tournament is not open for registration');
    }

    // Check registration deadline
    if (tournament.registrationDeadline && new Date() > tournament.registrationDeadline) {
      throw new BadRequestException('Registration deadline has passed');
    }

    // Check if user already joined
    const existingParticipation = await this.tournamentParticipantRepository.findOne({
      where: {
        tournamentId: joinTournamentDto.tournamentId,
        userId,
      },
    });

    if (existingParticipation) {
      throw new BadRequestException('User has already joined this tournament');
    }

    // Check if tournament is full
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      throw new BadRequestException('Tournament is full');
    }

    // Create participation record
    const participation = this.tournamentParticipantRepository.create({
      tournamentId: joinTournamentDto.tournamentId,
      userId,
      userAddress: joinTournamentDto.userAddress,
      status: tournament.requiresApproval ? ParticipantStatus.REGISTERED : ParticipantStatus.APPROVED,
      totalScore: 0,
      currentRoundScore: 0,
      correctPredictions: 0,
      totalPredictions: 0,
      accuracyRate: 0,
      rank: 0,
      previousRank: 0,
      entryFeePaid: tournament.entryFee,
      metadata: joinTournamentDto.metadata,
    });

    const savedParticipation = await this.tournamentParticipantRepository.save(participation);

    // Update tournament participant count
    await this.updateTournamentParticipantCount(joinTournamentDto.tournamentId);

    this.logger.log(`User ${userId} successfully joined tournament ${joinTournamentDto.tournamentId}`);
    return savedParticipation;
  }

  async approveParticipant(tournamentId: string, participantId: string, approverId: string): Promise<TournamentParticipant> {
    const participation = await this.tournamentParticipantRepository.findOne({
      where: { id: participantId, tournamentId },
    });

    if (!participation) {
      throw new NotFoundException('Participation not found');
    }

    if (participation.status !== ParticipantStatus.REGISTERED) {
      throw new BadRequestException('Participant is not in registered status');
    }

    participation.status = ParticipantStatus.APPROVED;
    participation.approvedBy = approverId;
    participation.approvedAt = new Date();

    return this.tournamentParticipantRepository.save(participation);
  }

  async eliminateParticipant(tournamentId: string, participantId: string, roundNumber: number): Promise<TournamentParticipant> {
    const participation = await this.tournamentParticipantRepository.findOne({
      where: { id: participantId, tournamentId },
    });

    if (!participation) {
      throw new NotFoundException('Participation not found');
    }

    if (participation.status !== ParticipantStatus.ACTIVE) {
      throw new BadRequestException('Participant is not active');
    }

    participation.status = ParticipantStatus.ELIMINATED;
    participation.eliminatedAt = new Date();
    participation.eliminationRound = roundNumber;

    return this.tournamentParticipantRepository.save(participation);
  }

  async getTournamentParticipants(tournamentId: string): Promise<TournamentParticipant[]> {
    return this.tournamentParticipantRepository.find({
      where: { tournamentId },
      relations: ['tournament'],
      order: { rank: 'ASC', totalScore: 'DESC' },
    });
  }

  async getUserTournamentParticipations(userId: string): Promise<TournamentParticipant[]> {
    return this.tournamentParticipantRepository.find({
      where: { userId },
      relations: ['tournament'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserParticipationInTournament(tournamentId: string, userId: string): Promise<TournamentParticipant | null> {
    return this.tournamentParticipantRepository.findOne({
      where: { tournamentId, userId },
      relations: ['tournament'],
    });
  }

  async updateParticipantScore(participantId: string, score: number, roundScore: number): Promise<TournamentParticipant> {
    const participation = await this.tournamentParticipantRepository.findOne({
      where: { id: participantId },
    });

    if (!participation) {
      throw new NotFoundException('Participation not found');
    }

    participation.totalScore = score;
    participation.currentRoundScore = roundScore;

    return this.tournamentParticipantRepository.save(participation);
  }

  async updateParticipantRank(participantId: string, rank: number): Promise<TournamentParticipant> {
    const participation = await this.tournamentParticipantRepository.findOne({
      where: { id: participantId },
    });

    if (!participation) {
      throw new NotFoundException('Participation not found');
    }

    participation.previousRank = participation.rank;
    participation.rank = rank;

    return this.tournamentParticipantRepository.save(participation);
  }

  async updateParticipantStats(participantId: string, correctPredictions: number, totalPredictions: number): Promise<TournamentParticipant> {
    const participation = await this.tournamentParticipantRepository.findOne({
      where: { id: participantId },
    });

    if (!participation) {
      throw new NotFoundException('Participation not found');
    }

    participation.correctPredictions = correctPredictions;
    participation.totalPredictions = totalPredictions;
    participation.accuracyRate = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

    return this.tournamentParticipantRepository.save(participation);
  }

  async getActiveParticipants(tournamentId: string): Promise<TournamentParticipant[]> {
    return this.tournamentParticipantRepository.find({
      where: { tournamentId, status: ParticipantStatus.ACTIVE },
      order: { totalScore: 'DESC' },
    });
  }

  async getEliminatedParticipants(tournamentId: string): Promise<TournamentParticipant[]> {
    return this.tournamentParticipantRepository.find({
      where: { tournamentId, status: ParticipantStatus.ELIMINATED },
      order: { eliminatedAt: 'ASC' },
    });
  }

  private async updateTournamentParticipantCount(tournamentId: string): Promise<void> {
    const count = await this.tournamentParticipantRepository.count({
      where: { tournamentId },
    });

    await this.tournamentRepository.update(tournamentId, {
      currentParticipants: count,
    });
  }
} 