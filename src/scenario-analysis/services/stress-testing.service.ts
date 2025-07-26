import { Injectable, Logger } from '@nestjs/common';
import { StressTestScenario } from '../interfaces/scenario-analysis.interfaces';
import { MarketSimulatorService } from './market-simulator.service';
import { RiskAssessmentService } from './risk-assessment.service';

@Injectable()
export class StressTestingService {
  private readonly logger = new Logger(StressTestingService.name);

  constructor(
    private marketSimulatorService: MarketSimulatorService,
    private riskAssessmentService: RiskAssessmentService,
  ) {}

  async runStressTest(scenarioId: string, stressScenario: StressTestScenario): Promise<any> {
    this.logger.log(`Running stress test: ${stressScenario.name} for scenario: ${scenarioId}`);

    const stressedMarketData = await this.generateStressedMarketData(stressScenario);
    const stressTestResults = await this.evaluateStressImpact(scenarioId, stressedMarketData);

    return {
      scenarioId,
      stressScenario,
      results: stressTestResults,
      timestamp: new Date(),
    };
  }

  private async generateStressedMarketData(stressScenario: StressTestScenario): Promise<any[]> {
    const basePrice = 100;
    const baseVolatility = 0.2;
    let stressedPrice = basePrice;
    let stressedVolatility = baseVolatility;

    switch (stressScenario.type) {
      case 'market_crash':
        stressedPrice = basePrice * (1 - this.getSeverityMultiplier(stressScenario.severity) * 0.3);
        stressedVolatility = baseVolatility * (1 + this.getSeverityMultiplier(stressScenario.severity));
        break;
      
      case 'volatility_spike':
        stressedVolatility = baseVolatility * (1 + this.getSeverityMultiplier(stressScenario.severity) * 2);
        break;
      
      case 'interest_rate_change':
        // Simulate interest rate impact on asset prices
        const rateChange = this.getSeverityMultiplier(stressScenario.severity) * 0.02;
        stressedPrice = basePrice * (1 - rateChange * 10); // Simplified impact
        break;
      
      case 'liquidity_crisis':
        stressedVolatility = baseVolatility * (1 + this.getSeverityMultiplier(stressScenario.severity) * 1.5);
        // Simulate wider bid-ask spreads and reduced volume
        break;
    }

    return this.marketSimulatorService.simulateGeometricBrownianMotion(
      stressedPrice,
      -0.1, // Negative drift during stress
      stressedVolatility,
      30, // 30 days
      720 // Hourly data
    );
  }

  private getSeverityMultiplier(severity: string): number {
    switch (severity) {
      case 'mild': return 0.5;
      case 'moderate': return 1.0;
      case 'severe': return 2.0;
      default: return 1.0;
    }
  }

  private async evaluateStressImpact(scenarioId: string, stressedData: any[]): Promise<any> {
    // Convert price data to returns
    const returns = stressedData.map((price, index) => {
      if (index === 0) return 0;
      return (price - stressedData[index - 1]) / stressedData[index - 1];
    }).slice(1);

    const totalReturn = returns.reduce((sum, ret) => sum + ret, 0);
    const maxLoss = Math.min(...returns.map((_, index) => 
      returns.slice(0, index + 1).reduce((sum, ret) => sum + ret, 0)
    ));

    const riskMetrics = await this.riskAssessmentService.calculateRiskMetrics(
      { returns },
      stressedData
    );

    return {
      totalReturn,
      maxLoss,
      riskMetrics,
      recoveryTime: this.calculateRecoveryTime(returns),
      stressImpactScore: this.calculateStressImpactScore(totalReturn, maxLoss, riskMetrics),
    };
  }

  private calculateRecoveryTime(returns: number[]): number {
    let cumulativeReturn = 0;
    let minReturn = 0;
    let recoveryIndex = -1;

    for (let i = 0; i < returns.length; i++) {
      cumulativeReturn += returns[i];
      
      if (cumulativeReturn < minReturn) {
        minReturn = cumulativeReturn;
        recoveryIndex = -1; // Reset recovery
      } else if (minReturn < 0 && cumulativeReturn >= 0 && recoveryIndex === -1) {
        recoveryIndex = i;
        break;
      }
    }

    return recoveryIndex === -1 ? returns.length : recoveryIndex;
  }

  private calculateStressImpactScore(totalReturn: number, maxLoss: number, riskMetrics: any): number {
    // Composite score from 0-100 (0 = severe impact, 100 = minimal impact)
    const returnComponent = Math.max(0, 50 + totalReturn * 100);
    const lossComponent = Math.max(0, 50 + maxLoss * 100);
    const varComponent = Math.max(0, 50 - riskMetrics.var95 * 100);
    
    return (returnComponent + lossComponent + varComponent) / 3;
  }

  async getStressTestTemplates(): Promise<StressTestScenario[]> {
    return [
      {
        name: '2008 Financial Crisis',
        type: 'market_crash',
        severity: 'severe',
        parameters: { marketDrop: 0.4, volatilityIncrease: 2.0, duration: 180 },
      },
      {
        name: 'COVID-19 Market Crash',
        type: 'market_crash',
        severity: 'severe',
        parameters: { marketDrop: 0.35, volatilityIncrease: 3.0, duration: 60 },
      },
      {
        name: 'Interest Rate Shock',
        type: 'interest_rate_change',
        severity: 'moderate',
        parameters: { rateChange: 0.03, duration: 365 },
      },
      {
        name: 'Flash Crash',
        type: 'liquidity_crisis',
        severity: 'severe',
        parameters: { liquidityDrop: 0.8, duration: 1 },
      },
      {
        name: 'Volatility Spike',
        type: 'volatility_spike',
        severity: 'moderate',
        parameters: { volatilityMultiplier: 2.5, duration: 30 },
      },
    ];
  }
}