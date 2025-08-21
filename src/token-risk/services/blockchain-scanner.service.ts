import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface ContractEvent {
  eventName: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  data: any;
}

@Injectable()
export class BlockchainScannerService {
  private readonly logger = new Logger(BlockchainScannerService.name);
  private readonly etherscanApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.etherscanApiKey = this.configService.get<string>('ETHERSCAN_API_KEY');
  }

  async scanContractEvents(tokenAddress: string, fromBlock: number = 0): Promise<ContractEvent[]> {
    try {
      const url = `https://api.etherscan.io/api`;
      const params = {
        module: 'logs',
        action: 'getLogs',
        address: tokenAddress,
        fromBlock: fromBlock.toString(),
        toBlock: 'latest',
        apikey: this.etherscanApiKey,
      };

      const response = await firstValueFrom(
        this.httpService.get(url, { params })
      );

      if (response.data.status === '1') {
        return this.parseContractEvents(response.data.result);
      }

      return [];
    } catch (error) {
      this.logger.error(`Failed to scan contract events for ${tokenAddress}:`, error);
      return [];
    }
  }

  async detectSuspiciousEvents(tokenAddress: string): Promise<string[]> {
    const suspiciousPatterns: string[] = [];
    const events = await this.scanContractEvents(tokenAddress);

    // Detect ownership transfers
    const ownershipChanges = events.filter(e => 
      e.eventName === 'OwnershipTransferred' || 
      e.data.topics?.includes('0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0')
    );

    if (ownershipChanges.length > 2) {
      suspiciousPatterns.push(`Multiple ownership transfers detected: ${ownershipChanges.length} changes`);
    }

    // Detect large token transfers
    const transfers = events.filter(e => 
      e.eventName === 'Transfer' ||
      e.data.topics?.includes('0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef')
    );

    const largeTransfers = transfers.filter(t => {
      // Parse transfer amount (simplified)
      const amount = parseInt(t.data.data || '0', 16);
      return amount > 1000000; // Threshold for "large" transfers
    });

    if (largeTransfers.length > 10) {
      suspiciousPatterns.push(`High frequency of large transfers: ${largeTransfers.length} transfers`);
    }

    // Detect approval events (potential for rug pull setup)
    const approvals = events.filter(e =>
      e.eventName === 'Approval' ||
      e.data.topics?.includes('0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925')
    );

    if (approvals.length > 50) {
      suspiciousPatterns.push(`Excessive approval events: ${approvals.length} approvals`);
    }

    return suspiciousPatterns;
  }

  private parseContractEvents(rawEvents: any[]): ContractEvent[] {
    return rawEvents.map(event => ({
      eventName: this.decodeEventName(event.topics?.[0] || ''),
      blockNumber: parseInt(event.blockNumber, 16),
      transactionHash: event.transactionHash,
      timestamp: parseInt(event.timeStamp, 16),
      data: event,
    }));
  }

  private decodeEventName(topic: string): string {
    // Common event signatures
    const eventSignatures: { [key: string]: string } = {
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer',
      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': 'Approval',
      '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0': 'OwnershipTransferred',
    };

    return eventSignatures[topic] || 'Unknown';
  }
}
