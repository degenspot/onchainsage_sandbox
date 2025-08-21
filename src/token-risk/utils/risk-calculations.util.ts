export class RiskCalculationUtils {
  
  static calculateZScore(value: number, mean: number, standardDeviation: number): number {
    if (standardDeviation === 0) return 0;
    return (value - mean) / standardDeviation;
  }

  static calculateMovingAverage(values: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - window + 1);
      const subset = values.slice(start, i + 1);
      const average = subset.reduce((sum, val) => sum + val, 0) / subset.length;
      result.push(average);
    }
    return result;
  }

  static detectOutliers(values: number[], threshold: number = 2): boolean[] {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    return values.map(value => Math.abs(this.calculateZScore(value, mean, standardDeviation)) > threshold);
  }

  static calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * 100; // Return as percentage
  }

  static calculateLiquidityScore(currentLiquidity: number, historicalLiquidity: number[]): number {
    if (historicalLiquidity.length === 0) return 50; // Neutral score

    const avgHistorical = historicalLiquidity.reduce((sum, liq) => sum + liq, 0) / historicalLiquidity.length;
    const ratio = currentLiquidity / avgHistorical;

    // Score from 0-100 where 100 is highest risk
    if (ratio < 0.2) return 100; // 80% liquidity drop = max risk
    if (ratio < 0.5) return 80;  // 50% liquidity drop = high risk
    if (ratio < 0.8) return 50;  // 20% liquidity drop = medium risk
    return 20; // Stable or increasing liquidity = low risk
  }
}