import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SignalGeneratorService } from '../services/signal-generator.service';
import { SignalParametersService } from '../services/signal-parameters.service';

@Injectable()
export class SignalGenerationJob {
  private readonly logger = new Logger(SignalGenerationJob.name);

  constructor(
    private readonly signalGenerator: SignalGeneratorService,
    private readonly parametersService: SignalParametersService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async generateSignalsForWatchlist(): Promise<void> {
    try {
      // Get active parameter sets
      const parameterSets = await this.parametersService.getAllParameters();
      
      // Get watchlist tokens (this could be from database or config)
      const watchlistTokens = await this.getWatchlistTokens();

      this.logger.log(`Generating signals for ${watchlistTokens.length} tokens with ${parameterSets.length} parameter sets`);

      // Generate signals for each token with each parameter set
      const signalPromises = watchlistTokens.flatMap(token =>
        parameterSets.map(params =>
          this.signalGenerator.generateSignal(
            token.address,
            token.symbol,
            params.name // Using name as ID for simplicity
          ).catch(error => {
            this.logger.error(`Signal generation failed for ${token.symbol}:`, error);
            return null;
          })
        )
      );

      const results = await Promise.allSettled(signalPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      this.logger.log(`Signal generation completed: ${successful}/${signalPromises.length} successful`);
    } catch (error) {
      this.logger.error('Automated signal generation failed:', error);
    }
  }

  private async getWatchlistTokens(): Promise<Array<{ address: string; symbol: string }>> {
    // This would typically come from a database or configuration
    return [
      { address: '0xA0b86a33E6C4C30c0cbDBce5E4f4E5F9B8E6E5E0', symbol: 'ETH' },
      { address: '0xB1c73a69e4c2a30c0cbdbce5e4f4e5f9b8e6e5e1', symbol: 'BTC' },
      { address: '0xC2d84a78e5c2b30c0cbdbce5e4f4e5f9b8e6e5e2', symbol: 'USDC' },
      // Add more tokens as needed
    ];
  }
}