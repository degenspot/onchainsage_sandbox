@Injectable()
export class ReportService {
  generateReport(result: BacktestResult): string {
    const report = `
# Backtesting Report: ${result.strategyName}

## Performance Summary
- **Total Return**: ${(result.totalReturn * 100).toFixed(2)}%
- **Annualized Return**: ${(result.annualizedReturn * 100).toFixed(2)}%
- **Sharpe Ratio**: ${result.sharpeRatio.toFixed(2)}
- **Maximum Drawdown**: ${(result.maxDrawdown * 100).toFixed(2)}%
- **Win Rate**: ${(result.winRate * 100).toFixed(2)}%
- **Total Trades**: ${result.totalTrades}
- **Profit Factor**: ${result.profitFactor.toFixed(2)}
- **Calmar Ratio**: ${result.calmarRatio.toFixed(2)}

## Trade Analysis
${this.generateTradeAnalysis(result.trades)}

## Risk Metrics
- **Best Trade**: $${Math.max(...result.trades.map(t => t.pnl || 0)).toFixed(2)}
- **Worst Trade**: $${Math.min(...result.trades.map(t => t.pnl || 0)).toFixed(2)}
- **Average Trade**: $${(result.trades.reduce((sum, t) => sum + (t.pnl || 0), 0) / result.trades.length).toFixed(2)}

## Monthly Returns
${this.generateMonthlyReturns(result.equityCurve)}
    `;

    return report.trim();
  }

  private generateTradeAnalysis(trades: Trade[]): string {
    const completedTrades = trades.filter(t => t.pnl !== undefined);
    if (completedTrades.length === 0) return 'No completed trades';

    const winning = completedTrades.filter(t => t.pnl! > 0);
    const losing = completedTrades.filter(t => t.pnl! < 0);

    return `
- **Winning Trades**: ${winning.length} (${((winning.length / completedTrades.length) * 100).toFixed(1)}%)
- **Losing Trades**: ${losing.length} (${((losing.length / completedTrades.length) * 100).toFixed(1)}%)
- **Average Winning Trade**: $${winning.length > 0 ? (winning.reduce((sum, t) => sum + t.pnl!, 0) / winning.length).toFixed(2) : '0.00'}
- **Average Losing Trade**: $${losing.length > 0 ? (losing.reduce((sum, t) => sum + t.pnl!, 0) / losing.length).toFixed(2) : '0.00'}
    `.trim();
  }

  private generateMonthlyReturns(equityCurve: Array<{ timestamp: Date; value: number }>): string {
    const monthlyReturns = new Map<string, { start: number; end: number }>();
    
    equityCurve.forEach(point => {
      const monthKey = `${point.timestamp.getFullYear()}-${String(point.timestamp.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyReturns.has(monthKey)) {
        monthlyReturns.set(monthKey, { start: point.value, end: point.value });
      } else {
        monthlyReturns.get(monthKey)!.end = point.value;
      }
    });

    let result = '| Month | Return |\n|-------|--------|\n';
    for (const [month, values] of monthlyReturns) {
      const monthReturn = ((values.end - values.start) / values.start * 100).toFixed(2);
      result += `| ${month} | ${monthReturn}% |\n`;
    }

    return result;
  }

  exportTradesToCSV(trades: Trade[]): string {
    const headers = 'ID,Symbol,Side,Quantity,Entry Price,Exit Price,Entry Time,Exit Time,PnL,Commission\n';
    const rows = trades.map(t => 
      `${t.id},${t.symbol},${t.side},${t.quantity},${t.entryPrice},${t.exitPrice || ''},${t.entryTime.toISOString()},${t.exitTime?.toISOString() || ''},${t.pnl || ''},${t.commission}`
    ).join('\n');
    
    return headers + rows;
  }
}