import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignalValidation } from '../entities/signal-validation.entity';
import { Signal } from '../entities/signal.entity';
import { ValidationType, ValidationStatus } from '../../../shared/enums/signal.enums';

@Injectable()
export class SignalValidationService {
  constructor(
    @InjectRepository(SignalValidation)
    private validationRepository: Repository<SignalValidation>,
    @InjectRepository(Signal)
    private signalRepository: Repository<Signal>,
  ) {}

  async validateSignal(
    signalId: string,
    validationType: ValidationType,
    validatedBy: string,
    validationData?: Record<string, any>,
  ): Promise<SignalValidation> {
    const signal = await this.signalRepository.findOne({ where: { id: signalId } });
    
    if (!signal) {
      throw new Error(`Signal with ID ${signalId} not found`);
    }

    const validationScore = await this.calculateValidationScore(signal, validationType, validationData);
    const status = this.determineValidationStatus(validationScore);

    const validation = this.validationRepository.create({
      signalId,
      validationType,
      status,
      validationScore,
      validationData,
      validatedBy,
    });

    return await this.validationRepository.save(validation);
  }

  async getSignalValidations(signalId: string): Promise<SignalValidation[]> {
    return await this.validationRepository.find({
      where: { signalId },
      order: { validatedAt: 'DESC' },
    });
  }

  async updateSignalConfidence(signalId: string): Promise<void> {
    const validations = await this.getSignalValidations(signalId);
    const signal = await this.signalRepository.findOne({ where: { id: signalId } });

    if (!signal || validations.length === 0) return;

    // Calculate weighted confidence based on validations
    const weightedScore = this.calculateWeightedConfidence(validations);
    
    signal.confidenceScore = Math.min(100, Math.max(0, weightedScore));
    await this.signalRepository.save(signal);
  }

  private async calculateValidationScore(
    signal: Signal,
    validationType: ValidationType,
    validationData?: Record<string, any>,
  ): Promise<number> {
    // Implement validation logic based on type
    switch (validationType) {
      case ValidationType.TECHNICAL_ANALYSIS:
        return this.validateTechnicalAnalysis(signal, validationData);
      case ValidationType.FUNDAMENTAL_ANALYSIS:
        return this.validateFundamentalAnalysis(signal, validationData);
      case ValidationType.RISK_ASSESSMENT:
        return this.validateRiskAssessment(signal, validationData);
      case ValidationType.BACKTESTING:
        return this.validateBacktesting(signal, validationData);
      default:
        return 50; // Default neutral score
    }
  }

  private validateTechnicalAnalysis(signal: Signal, data?: Record<string, any>): number {
    // Implement technical analysis validation logic
    let score = 50;
    
    // Example: Check if signal has proper stop loss and take profit
    if (signal.stopLoss && signal.takeProfit) {
      score += 20;
    }
    
    // Example: Validate risk-reward ratio
    if (signal.stopLoss && signal.takeProfit && signal.entryPrice) {
      const riskReward = this.calculateRiskRewardRatio(signal);
      if (riskReward >= 1.5) score += 15;
      if (riskReward >= 2.0) score += 15;
    }
    
    return Math.min(100, score);
  }

  private validateFundamentalAnalysis(signal: Signal, data?: Record<string, any>): number {
    // Implement fundamental analysis validation
    return 70; // Placeholder
  }

  private validateRiskAssessment(signal: Signal, data?: Record<string, any>): number {
    // Implement risk assessment validation
    let score = 50;
    
    // Check position sizing
    if (data?.positionSize && data.positionSize <= 0.02) { // Max 2% risk
      score += 25;
    }
    
    // Check portfolio correlation
    if (data?.portfolioCorrelation && data.portfolioCorrelation < 0.7) {
      score += 25;
    }
    
    return Math.min(100, score);
  }

  private validateBacktesting(signal: Signal, data?: Record<string, any>): number {
    // Implement backtesting validation
    let score = 50;
    
    if (data?.backtestResults) {
      const { winRate, sharpeRatio, maxDrawdown } = data.backtestResults;
      
      if (winRate > 0.6) score += 20;
      if (sharpeRatio > 1.5) score += 15;
      if (maxDrawdown < 0.1) score += 15;
    }
    
    return Math.min(100, score);
  }

  private calculateRiskRewardRatio(signal: Signal): number {
    if (!signal.stopLoss || !signal.takeProfit || !signal.entryPrice) return 0;
    
    const risk = Math.abs(signal.entryPrice - signal.stopLoss);
    const reward = Math.abs(signal.takeProfit - signal.entryPrice);
    
    return risk > 0 ? reward / risk : 0;
  }

  private determineValidationStatus(score: number): ValidationStatus {
    if (score >= 80) return ValidationStatus.APPROVED;
    if (score >= 60) return ValidationStatus.UNDER_REVIEW;
    return ValidationStatus.REJECTED;
  }

  private calculateWeightedConfidence(validations: SignalValidation[]): number {
    const weights = {
      [ValidationType.TECHNICAL_ANALYSIS]: 0.3,
      [ValidationType.FUNDAMENTAL_ANALYSIS]: 0.25,
      [ValidationType.RISK_ASSESSMENT]: 0.25,
      [ValidationType.BACKTESTING]: 0.2,
    };

    let totalWeight = 0;
    let weightedSum = 0;

    validations.forEach(validation => {
      const weight = weights[validation.validationType] || 0.1;
      weightedSum += validation.validationScore * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 50;
  }
}