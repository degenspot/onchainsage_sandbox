import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';

export class BacktestRequestDto {
  strategyName: string;
  symbol: string;
  startDate: string;
  endDate: string;
  parameters: Record<string, any>;
  initialCapital?: number;
}

export class OptimizationRequestDto {
  strategyName: string;
  symbol: string;
  startDate: string;
  endDate: string;
  baseParameters: Record<string, any>;
  parameterRanges: Record<string, { min: number; max: number; step: number }>;
  metric?: 'sharpeRatio' | 'totalReturn' | 'calmarRatio';
}

@Controller('backtesting')
export class BacktestingController {
  constructor(
    private backtestingEngine: BacktestingEngine,
    private reportService: ReportService,
    private optimizationService: OptimizationService
  ) {}

  @Post('run')
  async runBacktest(@Body() request: BacktestRequestDto) {
    const config: StrategyConfig = {
      name: request.strategyName,
      parameters: request.parameters,
      riskManagement: {
        maxPositionSize: 100,
        maxDrawdown: 0.2
      },
      commission: 5
    };

    const strategy = new MovingAverageCrossoverStrategy(config);
    const result = await this.backtestingEngine.runBacktest(
      strategy,
      request.symbol,
      new Date(request.startDate),
      new Date(request.endDate),
      request.initialCapital || 100000
    );

    return {
      result,
      report: this.reportService.generateReport(result)
    };
  }

  @Post('optimize')
  async optimizeStrategy(@Body() request: OptimizationRequestDto) {
    const baseConfig: StrategyConfig = {
      name: request.strategyName,
      parameters: request.baseParameters,
      riskManagement: {
        maxPositionSize: 100,
        maxDrawdown: 0.2
      },
      commission: 5
    };

    const results = await this.optimizationService.optimizeStrategy(
      MovingAverageCrossoverStrategy,
      baseConfig,
      request.parameterRanges,
      request.symbol,
      new Date(request.startDate),
      new Date(request.endDate),
      request.metric
    );

    return {
      optimizationResults: results.slice(0, 10), // Top 10 results
      bestParameters: results[0]?.parameters,
      bestPerformance: results[0]?.performance
    };
  }

  @Get('report/:strategyName')
  async getReport(@Param('strategyName') strategyName: string) {
    // This would typically fetch stored results from database
    // For demo, returning a placeholder
    return { message: `Report for ${strategyName} would be retrieved from storage` };
  }

  @Post('walk-forward')
  async walkForwardAnalysis(@Body() request: BacktestRequestDto) {
    const config: StrategyConfig = {
      name: request.strategyName,
      parameters: request.parameters,
      riskManagement: {
        maxPositionSize: 100,
        maxDrawdown: 0.2
      },
      commission: 5
    };

    const results = await this.optimizationService.walkForwardAnalysis(
      MovingAverageCrossoverStrategy,
      config,
      request.symbol,
      new Date(request.startDate),
      new Date(request.endDate)
    );

    return {
      walkForwardResults: results,
      summary: {
        totalPeriods: results.length,
        avgReturn: results.reduce((sum, r) => sum + r.totalReturn, 0) / results.length,
        avgSharpe: results.reduce((sum, r) => sum + r.sharpeRatio, 0) / results.length,
        consistency: results.filter(r => r.totalReturn > 0).length / results.length
      }
    };
  }
}
