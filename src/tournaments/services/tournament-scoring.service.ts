import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TournamentPrediction, PredictionStatus, PredictionType } from '../entities/tournament-prediction.entity';
import { TournamentParticipant } from '../entities/tournament-participant.entity';
import { TournamentRound } from '../entities/tournament-round.entity';
import { SubmitPredictionDto } from '../dto/submit-prediction.dto';

@Injectable()
export class TournamentScoringService {
  private readonly logger = new Logger(TournamentScoringService.name);

  constructor(
    @InjectRepository(TournamentPrediction)
    private tournamentPredictionRepository: Repository<TournamentPrediction>,
    @InjectRepository(TournamentParticipant)
    private tournamentParticipantRepository: Repository<TournamentParticipant>,
    @InjectRepository(TournamentRound)
    private tournamentRoundRepository: Repository<TournamentRound>,
  ) {}

  async submitPrediction(submitPredictionDto: SubmitPredictionDto, userId: string): Promise<TournamentPrediction> {
    this.logger.log(`User ${userId} submitting prediction for tournament ${submitPredictionDto.tournamentId}`);

    // Validate that user is an active participant
    const participation = await this.tournamentParticipantRepository.findOne({
      where: {
        tournamentId: submitPredictionDto.tournamentId,
        userId,
        status: 'active',
      },
    });

    if (!participation) {
      throw new Error('User is not an active participant in this tournament');
    }

    // Check if prediction already exists
    const existingPrediction = await this.tournamentPredictionRepository.findOne({
      where: {
        tournamentId: submitPredictionDto.tournamentId,
        participantId: participation.id,
        roundId: submitPredictionDto.roundId,
        marketId: submitPredictionDto.marketId,
      },
    });

    if (existingPrediction) {
      throw new Error('Prediction already submitted for this market in this round');
    }

    // Create prediction record
    const prediction = this.tournamentPredictionRepository.create({
      tournamentId: submitPredictionDto.tournamentId,
      participantId: participation.id,
      roundId: submitPredictionDto.roundId,
      marketId: submitPredictionDto.marketId,
      predictionType: submitPredictionDto.predictionType,
      prediction: submitPredictionDto.prediction,
      confidence: submitPredictionDto.confidence || 0.5,
      stakeAmount: submitPredictionDto.stakeAmount || 0,
      status: PredictionStatus.PENDING,
      score: 0,
      maxPossibleScore: this.calculateMaxPossibleScore(submitPredictionDto),
      metadata: submitPredictionDto.metadata,
    });

    const savedPrediction = await this.tournamentPredictionRepository.save(prediction);

    this.logger.log(`Prediction submitted with ID: ${savedPrediction.id}`);
    return savedPrediction;
  }

  async calculateScore(predictionId: string, actualOutcome: string): Promise<number> {
    const prediction = await this.tournamentPredictionRepository.findOne({
      where: { id: predictionId },
    });

    if (!prediction) {
      throw new Error('Prediction not found');
    }

    let score = 0;
    const isCorrect = this.evaluatePrediction(prediction.prediction, actualOutcome, prediction.predictionType);

    if (isCorrect) {
      // Base score for correct prediction
      score = 100;

      // Bonus for confidence (if user was confident and correct)
      if (prediction.confidence > 0.7) {
        score += Math.floor(prediction.confidence * 50);
      }

      // Bonus for stake amount (if user staked more)
      if (prediction.stakeAmount > 0) {
        score += Math.floor(prediction.stakeAmount * 10);
      }

      prediction.status = PredictionStatus.CORRECT;
    } else {
      // Penalty for incorrect prediction
      score = -20;

      // Additional penalty for high confidence but wrong prediction
      if (prediction.confidence > 0.8) {
        score -= Math.floor(prediction.confidence * 30);
      }

      prediction.status = PredictionStatus.INCORRECT;
    }

    prediction.score = score;
    prediction.resolvedAt = new Date();
    await this.tournamentPredictionRepository.save(prediction);

    return score;
  }

  async calculateRoundScores(tournamentId: string, roundId: string): Promise<void> {
    this.logger.log(`Calculating scores for tournament ${tournamentId}, round ${roundId}`);

    const predictions = await this.tournamentPredictionRepository.find({
      where: { tournamentId, roundId },
      relations: ['participant'],
    });

    const participantScores = new Map<string, { totalScore: number; correctPredictions: number; totalPredictions: number }>();

    for (const prediction of predictions) {
      const participantId = prediction.participantId;
      const currentStats = participantScores.get(participantId) || {
        totalScore: 0,
        correctPredictions: 0,
        totalPredictions: 0,
      };

      currentStats.totalScore += prediction.score;
      currentStats.totalPredictions += 1;

      if (prediction.status === PredictionStatus.CORRECT) {
        currentStats.correctPredictions += 1;
      }

      participantScores.set(participantId, currentStats);
    }

    // Update participant scores
    for (const [participantId, stats] of participantScores) {
      await this.tournamentParticipantRepository.update(participantId, {
        totalScore: stats.totalScore,
        currentRoundScore: stats.totalScore,
        correctPredictions: stats.correctPredictions,
        totalPredictions: stats.totalPredictions,
        accuracyRate: stats.totalPredictions > 0 ? (stats.correctPredictions / stats.totalPredictions) * 100 : 0,
      });
    }
  }

  async calculateTournamentRankings(tournamentId: string): Promise<void> {
    this.logger.log(`Calculating rankings for tournament ${tournamentId}`);

    const participants = await this.tournamentParticipantRepository.find({
      where: { tournamentId },
      order: { totalScore: 'DESC', accuracyRate: 'DESC' },
    });

    // Update rankings
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      const newRank = i + 1;

      await this.tournamentParticipantRepository.update(participant.id, {
        previousRank: participant.rank,
        rank: newRank,
      });
    }
  }

  async getParticipantPredictions(tournamentId: string, participantId: string, roundId?: string): Promise<TournamentPrediction[]> {
    const whereClause: any = { tournamentId, participantId };
    if (roundId) {
      whereClause.roundId = roundId;
    }

    return this.tournamentPredictionRepository.find({
      where: whereClause,
      relations: ['round'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRoundPredictions(tournamentId: string, roundId: string): Promise<TournamentPrediction[]> {
    return this.tournamentPredictionRepository.find({
      where: { tournamentId, roundId },
      relations: ['participant'],
      order: { createdAt: 'ASC' },
    });
  }

  async getTournamentPredictions(tournamentId: string): Promise<TournamentPrediction[]> {
    return this.tournamentPredictionRepository.find({
      where: { tournamentId },
      relations: ['participant', 'round'],
      order: { createdAt: 'DESC' },
    });
  }

  private evaluatePrediction(prediction: string, actualOutcome: string, predictionType: PredictionType): boolean {
    switch (predictionType) {
      case PredictionType.YES:
      case PredictionType.NO:
        return prediction.toLowerCase() === actualOutcome.toLowerCase();

      case PredictionType.NUMERIC:
        const predNum = parseFloat(prediction);
        const actualNum = parseFloat(actualOutcome);
        if (isNaN(predNum) || isNaN(actualNum)) return false;
        // Allow for some tolerance in numeric predictions
        const tolerance = Math.abs(actualNum * 0.05); // 5% tolerance
        return Math.abs(predNum - actualNum) <= tolerance;

      case PredictionType.MULTIPLE_CHOICE:
        return prediction.toLowerCase() === actualOutcome.toLowerCase();

      case PredictionType.CUSTOM:
        // For custom predictions, use fuzzy matching
        return this.fuzzyMatch(prediction, actualOutcome);

      default:
        return prediction.toLowerCase() === actualOutcome.toLowerCase();
    }
  }

  private fuzzyMatch(prediction: string, actualOutcome: string): boolean {
    const pred = prediction.toLowerCase().trim();
    const actual = actualOutcome.toLowerCase().trim();
    
    // Simple fuzzy matching - can be enhanced with more sophisticated algorithms
    return pred.includes(actual) || actual.includes(pred) || pred === actual;
  }

  private calculateMaxPossibleScore(submitPredictionDto: SubmitPredictionDto): number {
    let maxScore = 100; // Base score

    // Bonus for high confidence
    if (submitPredictionDto.confidence && submitPredictionDto.confidence > 0.7) {
      maxScore += Math.floor(submitPredictionDto.confidence * 50);
    }

    // Bonus for stake amount
    if (submitPredictionDto.stakeAmount && submitPredictionDto.stakeAmount > 0) {
      maxScore += Math.floor(submitPredictionDto.stakeAmount * 10);
    }

    return maxScore;
  }
} 