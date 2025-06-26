@Injectable()
export class BacktestingEngine {
  constructor(private dataService: DataProcessingService) {}

  async runBacktest(
    strategy: BaseStrategy,
    symbol: string,
    startDate: Date,
    endDate: Date,
    initialCapital: number = 100000
  ): Promise<BacktestResult> {
    const data = await this.dataService.loadHistoricalData(symbol, startDate, endDate);
    const cleanData = this.dataService.cleanData(data);

    const portfolio: Portfolio = {
      cash: initialCapital,
      positions: new Map(),
      totalValue: initialCapital,
      trades: []
    };

    const equityCurve: Array<{ timestamp: Date; value: number }> = [];
    let tradeId = 0;

    for (let i = 0; i < cleanData.length; i++) {
      const signal = strategy.generateSignal(cleanData, i);
      const currentData = cleanData[i];

      if (signal.type === 'BUY' && signal.quantity > 0) {
        const cost = signal.price * signal.quantity + strategy['config'].commission;
        if (portfolio.cash >= cost) {
          portfolio.cash -= cost;
          const currentPosition = portfolio.positions.get(symbol) || 0;
          portfolio.positions.set(symbol, currentPosition + signal.quantity);

          portfolio.trades.push({
            id: `trade_${tradeId++}`,
            symbol,
            side: 'BUY',
            quantity: signal.quantity,
            entryPrice: signal.price,
            entryTime: signal.timestamp,
            commission: strategy['config'].commission
          });
        }
      } else if (signal.type === 'SELL' && signal.quantity > 0) {
        const currentPosition = portfolio.positions.get(symbol) || 0;
        const sellQuantity = Math.min(signal.quantity, currentPosition);
        
        if (sellQuantity > 0) {
          const revenue = signal.price * sellQuantity - strategy['config'].commission;
          portfolio.cash += revenue;
          portfolio.positions.set(symbol, currentPosition - sellQuantity);

          // Find matching buy trade and calculate PnL
          const buyTrade = portfolio.trades
            .filter(t => t.side === 'BUY' && t.symbol === symbol && !t.exitTime)
            .shift();

          if (buyTrade) {
            buyTrade.exitPrice = signal.price;
            buyTrade.exitTime = signal.timestamp;
            buyTrade.pnl = (signal.price - buyTrade.entryPrice) * sellQuantity - 
                          (buyTrade.commission + strategy['config'].commission);
          }
        }
      }

      // Update portfolio value
      const positionValue = (portfolio.positions.get(symbol) || 0) * currentData.close;
      portfolio.totalValue = portfolio.cash + positionValue;

      equityCurve.push({
        timestamp: currentData.timestamp,
        value: portfolio.totalValue
      });
    }

    return this.calculatePerformanceMetrics(portfolio, equityCurve, initialCapital, strategy['config'].name);
  }

  private calculatePerformanceMetrics(
    portfolio: Portfolio,
    equityCurve: Array<{ timestamp: Date; value: number }>,
    initialCapital: number,
    strategyName: string
  ): BacktestResult {
    const completedTrades = portfolio.trades.filter(t => t.pnl !== undefined);
    const totalReturn = (portfolio.totalValue - initialCapital) / initialCapital;
    
    // Calculate annualized return
    const daysDiff = (equityCurve[equityCurve.length - 1].timestamp.getTime() - 
                     equityCurve[0].timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const annualizedReturn = Math.pow(1 + totalReturn, 365 / daysDiff) - 1;

    // Calculate Sharpe ratio (assuming 3% risk-free rate)
    const returns = equityCurve.slice(1).map((curr, i) => 
      (curr.value - equityCurve[i].value) / equityCurve[i].value
    );
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const returnStd = Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = (avgReturn * 252 - 0.03) / (returnStd * Math.sqrt(252));

    // Calculate max drawdown
    let peak = initialCapital;
    let maxDrawdown = 0;
    for (const point of equityCurve) {
      if (point.value > peak) peak = point.value;
      const drawdown = (peak - point.value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Calculate win rate
    const winningTrades = completedTrades.filter(t => t.pnl! > 0).length;
    const winRate = completedTrades.length > 0 ? winningTrades / completedTrades.length : 0;

    // Calculate profit factor
    const grossProfit = completedTrades.filter(t => t.pnl! > 0).reduce((sum, t) => sum + t.pnl!, 0);
    const grossLoss = Math.abs(completedTrades.filter(t => t.pnl! < 0).reduce((sum, t) => sum + t.pnl!, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Calculate Calmar ratio
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

    return {
      strategyName,
      totalReturn,
      annualizedReturn,
      sharpeRatio,
      maxDrawdown,
      winRate,
      totalTrades: completedTrades.length,
      profitFactor,
      calmarRatio,
      trades: portfolio.trades,
      equityCurve
    };
  }
}