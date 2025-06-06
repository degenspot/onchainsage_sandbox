import { Controller, Get, Query } from '@nestjs/common';
import { VisualizationRequestDto } from '../dto/visualization-request.dto';
import { CorrelationService } from '../services/correlation.service';
import { DataFetcherService } from '../../blockchain/services/data-fetcher.service';

@Controller('analytics/trends')
export class TrendVisualizationController {
  constructor(
    private readonly correlationService: CorrelationService,
    private readonly dataFetcher: DataFetcherService,
  ) {}

  @Get('cross-chain')
  async getCrossChainCorrelation(
    @Query() params: VisualizationRequestDto,
  ) {
    const [chainAData, chainBData] = await Promise.all([
      this.dataFetcher.fetchChainData(params.chainA, params.timeRange),
      this.dataFetcher.fetchChainData(params.chainB, params.timeRange),
    ]);

    const correlation = this.correlationService.calculateCorrelation(
      chainAData,
      chainBData,
    );

    return {
      chains: [params.chainA, params.chainB],
      timeRange: params.timeRange,
      correlationScore: correlation.score,
      lagHours: correlation.lag,
      visualizationData: this.prepareVisualizationData(chainAData, chainBData),
    };
  }

  private prepareVisualizationData(chainA: any[], chainB: any[]) {
    
    // Prepare data for visualization   

    return {
      labels: chainA.map(d => d.timestamp.toISOString()),
      datasets: [
        {
          label: 'Chain A',
          data: chainA.map(d => d.transactionCount),
        },
        {
          label: 'Chain B',
          data: chainB.map(d => d.transactionCount),
        },
      ],
    };
  }
}