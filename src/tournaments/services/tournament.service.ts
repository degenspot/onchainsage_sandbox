import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament, TournamentStatus, TournamentType, TournamentFormat } from '../entities/tournament.entity';
import { TournamentRound, RoundStatus } from '../entities/tournament-round.entity';
import { CreateTournamentDto } from '../dto/create-tournament.dto';

@Injectable()
export class TournamentService {
  private readonly logger = new Logger(TournamentService.name);

  constructor(
    @InjectRepository(Tournament)
    private tournamentRepository: Repository<Tournament>,
    @InjectRepository(TournamentRound)
    private tournamentRoundRepository: Repository<TournamentRound>,
  ) {}

  async createTournament(createTournamentDto: CreateTournamentDto, userId: string): Promise<Tournament> {
    this.logger.log(`Creating new tournament: ${createTournamentDto.title}`);

    // Validate tournament dates
    const startDate = new Date(createTournamentDto.startDate);
    const endDate = new Date(createTournamentDto.endDate);
    const now = new Date();

    if (startDate <= now) {
      throw new BadRequestException('Tournament start date must be in the future');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('Tournament end date must be after start date');
    }

    if (createTournamentDto.registrationDeadline) {
      const registrationDeadline = new Date(createTournamentDto.registrationDeadline);
      if (registrationDeadline >= startDate) {
        throw new BadRequestException('Registration deadline must be before tournament start');
      }
    }

    // Validate tournament format and type compatibility
    this.validateTournamentFormat(createTournamentDto.format, createTournamentDto.tournamentType);

    // Create the tournament
    const tournament = this.tournamentRepository.create({
      ...createTournamentDto,
      creatorId: userId,
      startDate,
      endDate,
      registrationDeadline: createTournamentDto.registrationDeadline ? new Date(createTournamentDto.registrationDeadline) : null,
      status: TournamentStatus.UPCOMING,
      currentParticipants: 0,
      currentRound: 0,
    });

    const savedTournament = await this.tournamentRepository.save(tournament);

    // Create tournament rounds
    await this.createTournamentRounds(savedTournament.id, createTournamentDto.totalRounds);

    this.logger.log(`Created tournament with ID: ${savedTournament.id}`);
    return savedTournament;
  }

  async getAllTournaments(
    status?: TournamentStatus,
    tournamentType?: TournamentType,
    format?: TournamentFormat,
    page = 1,
    limit = 20,
  ): Promise<{ tournaments: Tournament[]; total: number }> {
    const queryBuilder = this.tournamentRepository
      .createQueryBuilder('tournament')
      .leftJoinAndSelect('tournament.participants', 'participants')
      .leftJoinAndSelect('tournament.rounds', 'rounds');

    if (status) {
      queryBuilder.andWhere('tournament.status = :status', { status });
    }

    if (tournamentType) {
      queryBuilder.andWhere('tournament.tournamentType = :tournamentType', { tournamentType });
    }

    if (format) {
      queryBuilder.andWhere('tournament.format = :format', { format });
    }

    queryBuilder.orderBy('tournament.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const tournaments = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { tournaments, total };
  }

  async getTournamentById(id: string): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id },
      relations: ['participants', 'rounds', 'leaderboards', 'rewards'],
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament with ID "${id}" not found`);
    }

    return tournament;
  }

  async getActiveTournaments(): Promise<Tournament[]> {
    const now = new Date();
    return this.tournamentRepository.find({
      where: {
        status: TournamentStatus.ACTIVE,
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
      relations: ['participants', 'rounds'],
      order: { startDate: 'ASC' },
    });
  }

  async getUpcomingTournaments(): Promise<Tournament[]> {
    const now = new Date();
    return this.tournamentRepository.find({
      where: {
        status: TournamentStatus.UPCOMING,
        startDate: { $gt: now },
      },
      relations: ['participants'],
      order: { startDate: 'ASC' },
    });
  }

  async updateTournamentStatus(id: string, status: TournamentStatus): Promise<Tournament> {
    const tournament = await this.getTournamentById(id);
    tournament.status = status;

    if (status === TournamentStatus.ACTIVE) {
      tournament.currentRound = 1;
      // Activate first round
      const firstRound = await this.tournamentRoundRepository.findOne({
        where: { tournamentId: id, roundNumber: 1 },
      });
      if (firstRound) {
        firstRound.status = RoundStatus.ACTIVE;
        await this.tournamentRoundRepository.save(firstRound);
      }
    }

    return this.tournamentRepository.save(tournament);
  }

  async advanceTournamentRound(id: string): Promise<Tournament> {
    const tournament = await this.getTournamentById(id);
    
    if (tournament.currentRound >= tournament.totalRounds) {
      throw new BadRequestException('Tournament has already completed all rounds');
    }

    // Complete current round
    const currentRound = await this.tournamentRoundRepository.findOne({
      where: { tournamentId: id, roundNumber: tournament.currentRound },
    });

    if (currentRound) {
      currentRound.status = RoundStatus.COMPLETED;
      await this.tournamentRoundRepository.save(currentRound);
    }

    // Advance to next round
    tournament.currentRound += 1;

    // Activate next round
    const nextRound = await this.tournamentRoundRepository.findOne({
      where: { tournamentId: id, roundNumber: tournament.currentRound },
    });

    if (nextRound) {
      nextRound.status = RoundStatus.ACTIVE;
      await this.tournamentRoundRepository.save(nextRound);
    }

    // Check if tournament is complete
    if (tournament.currentRound > tournament.totalRounds) {
      tournament.status = TournamentStatus.COMPLETED;
    }

    return this.tournamentRepository.save(tournament);
  }

  async getTournamentsByCreator(creatorId: string): Promise<Tournament[]> {
    return this.tournamentRepository.find({
      where: { creatorId },
      relations: ['participants', 'rounds'],
      order: { createdAt: 'DESC' },
    });
  }

  async searchTournaments(query: string): Promise<Tournament[]> {
    return this.tournamentRepository
      .createQueryBuilder('tournament')
      .leftJoinAndSelect('tournament.participants', 'participants')
      .where('tournament.title ILIKE :query OR tournament.description ILIKE :query', {
        query: `%${query}%`,
      })
      .orderBy('tournament.createdAt', 'DESC')
      .getMany();
  }

  async getTournamentAnalytics(id: string): Promise<any> {
    const tournament = await this.getTournamentById(id);
    
    const totalParticipants = tournament.participants.length;
    const activeParticipants = tournament.participants.filter(p => p.status === 'active').length;
    const eliminatedParticipants = tournament.participants.filter(p => p.status === 'eliminated').length;
    
    const rounds = tournament.rounds || [];
    const completedRounds = rounds.filter(r => r.status === RoundStatus.COMPLETED).length;
    const activeRounds = rounds.filter(r => r.status === RoundStatus.ACTIVE).length;

    return {
      tournamentId: id,
      totalParticipants,
      activeParticipants,
      eliminatedParticipants,
      totalRounds: tournament.totalRounds,
      currentRound: tournament.currentRound,
      completedRounds,
      activeRounds,
      tournamentStatus: tournament.status,
      timeRemaining: tournament.endDate.getTime() - new Date().getTime(),
    };
  }

  private async createTournamentRounds(tournamentId: string, totalRounds: number): Promise<void> {
    const rounds = [];
    
    for (let i = 1; i <= totalRounds; i++) {
      const round = this.tournamentRoundRepository.create({
        tournamentId,
        roundNumber: i,
        title: `Round ${i}`,
        description: `Tournament round ${i}`,
        status: i === 1 ? RoundStatus.UPCOMING : RoundStatus.UPCOMING,
        startDate: new Date(), // Will be set when round becomes active
        endDate: new Date(), // Will be set when round becomes active
        totalParticipants: 0,
        activeParticipants: 0,
        eliminatedParticipants: 0,
      });
      
      rounds.push(round);
    }

    await this.tournamentRoundRepository.save(rounds);
  }

  private validateTournamentFormat(format: TournamentFormat, type: TournamentType): void {
    // Add validation logic for format and type compatibility
    if (format === TournamentFormat.SINGLE_ELIMINATION && type === TournamentType.DAILY) {
      throw new BadRequestException('Single elimination format is not suitable for daily tournaments');
    }
  }
} 