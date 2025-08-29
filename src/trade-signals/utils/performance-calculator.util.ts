export class PerformanceCalculatorUtil {
  
  static calculateSharpeRatio(returns: number[], riskFreeRate: number = 0): number {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const excessReturn = avgReturn - riskFreeRate;
    
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const standardDeviation = Math.sqrt(variance);
    
    return standardDeviation === 0 ? 0 : excessReturn / standardDeviation;
  }

  static calculateMaxDrawdown(cumulativeReturns: number[]): number {
    let maxDrawdown = 0;
    let peak = cumulativeReturns[0] || 0;
    
    for (const value of cumulativeReturns) {
      if (value > peak) {
        peak = value;
      }
      
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown * 100; // Return as percentage
  }

  static calculateWinRate(trades: Array<{ pnl: number }>): number {
    if (trades.length === 0) return 0;
    
    const winningTrades = trades.filter(trade => trade.pnl > 0).length;
    return (winningTrades / trades.length) * 100;
  }

  static calculateSortinoRatio(returns: number[], targetReturn: number = 0): number {
    const excessReturns = returns.map(ret => ret - targetReturn);
    const avgExcessReturn = excessReturns.reduce((sum, ret) => sum + ret, 0) / excessReturns.length;
    
    const downside = excessReturns.filter(ret => ret < 0);
    if (downside.length === 0) return avgExcessReturn > 0 ? Infinity : 0;
    
    const downsideVariance = downside.reduce((sum, ret) => sum + ret * ret, 0) / downside.length;
    const downsideDeviation = Math.sqrt(downsideVariance);
    
    return downsideDeviation === 0 ? 0 : avgExcessReturn / downsideDeviation;
  }

  static calculateCalmarRatio(totalReturn: number, maxDrawdown: number): number {
    if (maxDrawdown === 0) return totalReturn > 0 ? Infinity : 0;
    return totalReturn / maxDrawdown;
  }
}