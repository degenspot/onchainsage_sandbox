import { Injectable, Logger } from '@nestjs/common';
import { VisualizationData, TimeSeriesPoint, DistributionPoint, PerformanceMetric } from '../interfaces/scenario-analysis.interfaces';

@Injectable()
export class VisualizationService {
  private readonly logger = new Logger(VisualizationService.name);

  async generateVisualizationData(scenarioId: string, scenarioResults: any): Promise<VisualizationData> {
    this.logger.log(`Generating visualization data for scenario: ${scenarioId}`);

    const timeSeries = await this.generateTimeSeries(scenarioResults);
    const riskDistribution = await this.generateRiskDistribution(scenarioResults.riskMetrics);
    const performanceMetrics = await this.generatePerformanceMetrics(scenarioResults);

    return {
      scenarioId,
      timeSeries,
      riskDistribution,
      performanceMetrics,
    };
  }

  private async generateTimeSeries(scenarioResults: any): Promise<TimeSeriesPoint[]> {
    const timeSeries: TimeSeriesPoint[] = [];
    const startDate = new Date();
    
    // Generate portfolio value over time
    let portfolioValue = 100000; // Starting value
    for (let i = 0; i < 252; i++) { // 252 trading days
      const dailyReturn = (Math.random() - 0.5) * 0.02; // Random daily return
      portfolioValue *= (1 + dailyReturn);
      
      timeSeries.push({
        timestamp: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
        value: portfolioValue,
        metric: 'portfolio_value',
      });
    }

    // Generate drawdown series
    let peak = portfolioValue;
    for (const point of timeSeries) {
      peak = Math.max(peak, point.value);
      const drawdown = (peak - point.value) / peak * 100;
      
      timeSeries.push({
        timestamp: point.timestamp,
        value: drawdown,
        metric: 'drawdown',
      });
    }

    return timeSeries;
  }

  private async generateRiskDistribution(riskMetrics: any): Promise<DistributionPoint[]> {
    const distribution: DistributionPoint[] = [];
    
    // Generate return distribution (normal distribution approximation)
    const mean = 0.001; // Daily mean return
    const std = 0.02; // Daily standard deviation
    
    for (let i = -100; i <= 100; i++) {
      const value = i * 0.001; // Return values from -10% to +10%
      const zScore = (value - mean) / std;
      const probability = Math.exp(-0.5 * zScore * zScore) / Math.sqrt(2 * Math.PI);
      
      distribution.push({
        value,
        probability: probability / std, // Normalize
      });
    }

    return distribution;
  }

  private async generatePerformanceMetrics(scenarioResults: any): Promise<PerformanceMetric[]> {
    return [
      {
        name: 'Total Return',
        value: scenarioResults.totalReturn * 100,
        benchmark: 8.0, // 8% benchmark
      },
      {
        name: 'Sharpe Ratio',
        value: scenarioResults.sharpeRatio,
        benchmark: 1.0,
      },
      {
        name: 'Max Drawdown',
        value: scenarioResults.maxDrawdown * 100,
        benchmark: 10.0, // 10% benchmark
      },
      {
        name: 'Win Rate',
        value: scenarioResults.winRate * 100,
        benchmark: 55.0, // 55% benchmark
      },
      {
        name: 'Volatility',
        value: scenarioResults.volatility * 100,
        benchmark: 15.0, // 15% benchmark
      },
      {
        name: 'VaR 95%',
        value: scenarioResults.riskMetrics.var95 * 100,
      },
      {
        name: 'Beta',
        value: scenarioResults.riskMetrics.beta,
        benchmark: 1.0,
      },
    ];
  }

  async generateChartConfig(visualizationData: VisualizationData): Promise<any> {
    return {
      portfolioChart: {
        type: 'line',
        data: {
          labels: visualizationData.timeSeries
            .filter(point => point.metric === 'portfolio_value')
            .map(point => point.timestamp.toISOString().split('T')[0]),
          datasets: [{
            label: 'Portfolio Value',
            data: visualizationData.timeSeries
              .filter(point => point.metric === 'portfolio_value')
              .map(point => point.value),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          }],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Portfolio Value ($)',
              },
            },
            x: {
              title: {
                display: true,
                text: 'Date',
              },
            },
          },
        },
      },
      drawdownChart: {
        type: 'line',
        data: {
          labels: visualizationData.timeSeries
            .filter(point => point.metric === 'drawdown')
            .map(point => point.timestamp.toISOString().split('T')[0]),
          datasets: [{
            label: 'Drawdown %',
            data: visualizationData.timeSeries
              .filter(point => point.metric === 'drawdown')
              .map(point => -point.value), // Negative for better visualization
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
          }],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              title: {
                display: true,
                text: 'Drawdown (%)',
              },
            },
          },
        },
      },
      riskDistribution: {
        type: 'line',
        data: {
          labels: visualizationData.riskDistribution.map(point => (point.value * 100).toFixed(1)),
          datasets: [{
            label: 'Return Distribution',
            data: visualizationData.riskDistribution.map(point => point.probability),
            borderColor: 'rgb(153, 102, 255)',
            fill: true,
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
          }],
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Return (%)',
              },
            },
            y: {
              title: {
                display: true,
                text: 'Probability Density',
              },
            },
          },
        },
      },
    };
  }
}