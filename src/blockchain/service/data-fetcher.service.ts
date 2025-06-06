import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
import { NormalizedChainData } from '../../shared/interfaces/normalized-chain-data.interface';

@Injectable()
export class DataFetcherService {
  constructor(private readonly httpService: HttpService) {}

  async fetchChainData(chain: string, endpoint: string): Promise<NormalizedChainData[]> {
    try {
      const response: AxiosResponse = await this.httpService.get(endpoint).toPromise();
      return this.normalizeData(response.data, chain);
    } catch (error) {
      throw new Error(`Failed to fetch data from ${chain}: ${error.message}`);
    }
  }

  private normalizeData(rawData: any, chain: string): NormalizedChainData[] {
    // Implementation varies per chain
    return rawData.map(item => ({
      chain,
      timestamp: new Date(item.timestamp),
      transactionCount: item.transactionCount || item.tx_count,
      uniqueAddresses: item.uniqueAddresses || item.unique_address_count,
      gasFees: item.gasFees || item.gas_fees,
    }));
  }
}