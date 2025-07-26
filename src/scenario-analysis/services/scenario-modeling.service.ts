import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scenario } from '../entities/scenario.entity';
import { ScenarioParameters, ScenarioResult } from '../interfaces/scenario-analysis.interfaces';
import { MarketSimulatorService } from './market-simulator.service';
import { RiskAssessmentService } from './risk-assessment.service';

@Injectable()
export class ScenarioModelingService {
  private readonly logger = new Logger(ScenarioModelingService.name);

  constructor(
    @InjectRepository(Scenario)
    private scenarioRepository: Repository<Scenario>,
    private marketSimulatorService: MarketSimulatorService,
    private riskAssessmentService: RiskAssessmentService,
  ) {}

  async createScenario(parameters: ScenarioParameters): Promise<Scenario> {
    this.logger.log(`Creating scenario: ${parameters.name}`);
    
    const scenario = this.scenarioRepository.create({
      name: parameters.name,
      description: parameters.description,
      duration: parameters.duration,
      parameters: parameters,
      status: 'pending',
    });

    return this.scenarioRepository.save(scenario);
  }

  async runScenario(scenarioId: string): Promise<ScenarioResult> {
    this.logger.log(`Running scenario: ${scenarioId}`);
    
    const scenario = await this.scenarioRepository.findOne({ where: { id: scenarioId } });
    if (!scenario) {
      throw new Error('Scenario not found');
    }

    // Update status to running
    await this.scenarioRepository.update(scenarioId, { status: 'running' });

    try {
      const parameters = scenario.parameters as ScenarioParameters;
      
      // Simulate market conditions
      const simulatedPrices = await this.marketSimulatorService.simulateMarketConditions(
        parameters.marketConditions,
        parameters.duration
      );

      // Calculate strategy performance
      const strategyResults = await this.calculateStrategyPerformance(
        parameters.strategies,
        simulatedPrices
      );

      // Assess risks
      const riskMetrics = await this.riskAssessmentService.calculateRiskMetrics(
        strategyResults,
        simulatedPrices
      );

      const result: ScenarioResult = {
        scenarioId,
        totalReturn: strategyResults.totalReturn,
        maxDrawdown: strategyResults.maxDrawdown,
        sharpeRatio: strategyResults.sharpeRatio,
        volatility: strategyResults.volatility,
        winRate: strategyResults.winRate,
        profitFactor: strategyResults.profitFactor,
        riskMetrics,
      };

      // Update scenario with results
      await this.scenarioRepository.update(scenarioId, {
        results: result,
        status: 'completed',
      });

      return result;
    } catch (error) {
      this.logger.error(`Scenario execution failed: ${error.message}`);
      await this.scenarioRepository.update(scenarioId, { status: 'failed' });
      throw error;
    }
  }

  private async calculateStrategyPerformance(strategies: any[], simulatedPrices: any[]): Promise<any> {
    // Implementation for strategy performance calculation
    let totalReturn = 0;
    let wins = 0;
    let losses = 0;
    const returns: number[] = [];

    for (const strategy of strategies) {
      const strategyReturn = this.calculateSingleStrategyReturn(strategy, simulatedPrices);
      totalReturn += strategyReturn;
      returns.push(strategyReturn);
      
      if (strategyReturn > 0) wins++;
      else losses++;
    }

    const winRate = wins / (wins + losses);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const volatility = this.calculateVolatility(returns);
    const sharpeRatio = avgReturn / volatility;
    const maxDrawdown = this.calculateMaxDrawdown(returns);
    
    const grossProfits = returns.filter(r => r > 0).reduce((sum, r) => sum + r, 0);
    const grossLosses = Math.abs(returns.filter(r => r < 0).reduce((sum, r) => sum + r, 0));
    const profitFactor = grossLosses === 0 ? Infinity : grossProfits / grossLosses;

    return {
      totalReturn,
      maxDrawdown,
      sharpeRatio,
      volatility,
      winRate,
      profitFactor,
    };
  }

  private calculateSingleStrategyReturn(strategy: any, prices: any[]): number {
    // Simplified strategy return calculation
    const entryPrice = strategy.entryPrice;
    const exitPrice = strategy.exitPrice || prices[prices.length - 1].price;
    const quantity = strategy.quantity;

    if (strategy.type === 'long') {
      return ((exitPrice - entryPrice) / entryPrice) * quantity;
    } else if (strategy.type === 'short') {
      return ((entryPrice - exitPrice) / entryPrice) * quantity;
    }
    return 0;
  }

  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  private calculateMaxDrawdown(returns: number[]): number {
    let maxDrawdown = 0;
    let peak = 0;
    let cumulative = 0;

    for (const ret of returns) {
      cumulative += ret;
      peak = Math.max(peak, cumulative);
      const drawdown = (peak - cumulative) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  }

  async getScenario(id: string): Promise<Scenario> {
    return this.scenarioRepository.findOne({ where: { id } });
  }

  async getAllScenarios(): Promise<Scenario[]> {
    return this.scenarioRepository.find();
  }

  async deleteScenario(id: string): Promise<void> {
    await this.scenarioRepository.delete(id);
  }
}
