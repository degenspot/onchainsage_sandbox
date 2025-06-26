@Injectable()
export class OptimizationService {
  constructor(
    private backtestingEngine: BacktestingEngine,
    private dataService: DataProcessingService
  ) {}

  async optimizeStrategy(
    strategyClass: typeof BaseStrategy,
    baseConfig: StrategyConfig,
    parameterRanges: Record<string, { min: number; max: number; step: number }>,
    symbol: string,
    startDate: Date,
    endDate: Date,
    optimizationMetric: 'sharpeRatio' | 'totalReturn' | 'calmarRatio' = 'sharpeRatio'
  ): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];
    const parameterCombinations = this.generateParameterCombinations(parameterRanges);

    for (const params of parameterCombinations) {
      const config = {
        ...baseConfig,
        parameters: { ...baseConfig.parameters, ...params }
      };

      const strategy = new strategyClass(config);
      const backtest = await this.backtestingEngine.runBacktest(
        strategy,
        symbol,
        startDate,
        endDate
      );

      results.push({
        parameters: params,
        performance: backtest,
        score: backtest[optimizationMetric]
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private generateParameterCombinations(
    ranges: Record<string, { min: number; max: number; step: number }>
  ): Record<string, number>[] {
    const keys = Object.keys(ranges);
    const combinations: Record<string, number>[] = [];

    const generate = (index: number, current: Record<string, number>) => {
      if (index === keys.length) {
        combinations.push({ ...current });
        return;
      }

      const key = keys[index];
      const range = ranges[key];
      
      for (let value = range.min; value <= range.max; value += range.step) {
        current[key] = value;
        generate(index + 1, current);
      }
    };

    generate(0, {});
    return combinations;
  }

  async walkForwardAnalysis(
    strategyClass: typeof BaseStrategy,
    config: StrategyConfig,
    symbol: string,
    startDate: Date,
    endDate: Date,
    trainPeriodDays: number = 252,
    testPeriodDays: number = 63
  ): Promise<BacktestResult[]> {
    const results: BacktestResult[] = [];
    const current = new Date(startDate);

    while (current < endDate) {
      const trainEnd = new Date(current);
      trainEnd.setDate(trainEnd.getDate() + trainPeriodDays);
      
      const testStart = new Date(trainEnd);
      testStart.setDate(testStart.getDate() + 1);
      
      const testEnd = new Date(testStart);
      testEnd.setDate(testEnd.getDate() + testPeriodDays);

      if (testEnd > endDate) break;

      const strategy = new strategyClass(config);
      const result = await this.backtestingEngine.runBacktest(
        strategy,
        symbol,
        testStart,
        testEnd
      );

      results.push(result);
      current.setDate(current.getDate() + testPeriodDays);
    }

    return results;
  }
}
