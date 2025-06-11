import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly web3Provider: string;

  constructor(private configService: ConfigService) {
    this.web3Provider = this.configService.get<string>('WEB3_PROVIDER_URL') || 'https://mainnet.infura.io/v3/YOUR_KEY';
  }

  async getWalletBalance(address: string): Promise<number> {
    try {
      // Mock implementation - replace with actual Web3 call
      const response = await fetch(`${this.web3Provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        }),
      });
      
      const data = await response.json();
      return parseInt(data.result, 16) / Math.pow(10, 18); // Convert wei to ETH
    } catch (error) {
      this.logger.error(`Error fetching balance for ${address}:`, error);
      return 0;
    }
  }

  async getLatestTransactions(): Promise<any[]> {
    try {
      // Mock implementation - replace with actual blockchain monitoring
      const response = await fetch(`${this.web3Provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: ['latest', true],
          id: 1,
        }),
      });
      
      const data = await response.json();
      return data.result?.transactions || [];
    } catch (error) {
      this.logger.error('Error fetching latest transactions:', error);
      return [];
    }
  }

  async getTransactionReceipt(hash: string): Promise<any> {
    try {
      const response = await fetch(`${this.web3Provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [hash],
          id: 1,
        }),
      });
      
      const data = await response.json();
      return data.result;
    } catch (error) {
      this.logger.error(`Error fetching transaction receipt for ${hash}:`, error);
      return null;
    }
  }
}

// notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { WhaleMovement } from './whale-monitoring.service';

export interface NotificationChannel {
  email?: string[];
  webhook?: string;
  slack?: string;
  discord?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly channels: NotificationChannel = {
    email: ['admin@example.com'],
    webhook: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
  };

  async sendWhaleAlert(movement: WhaleMovement): Promise<void> {
    const message = this.formatWhaleMessage(movement);
    
    try {
      // Send to multiple channels
      await Promise.all([
        this.sendWebhookNotification(message),
        this.sendEmailNotification(message),
      ]);
      
      this.logger.log(`Whale alert sent for ${movement.wallet.address}`);
    } catch (error) {
      this.logger.error('Error sending whale alert:', error);
    }
  }

  private formatWhaleMessage(movement: WhaleMovement): string {
    const { wallet, transaction, impactLevel } = movement;
    
    return `🐋 WHALE ALERT - ${impactLevel.toUpperCase()} IMPACT
    
Wallet: ${wallet.address}
Transaction: ${transaction.transactionHash}
Amount: ${transaction.amount} ETH
Type: ${transaction.type}
Impact Score: ${transaction.impactScore.toFixed(2)}
Balance: ${wallet.balance} ETH
Time: ${new Date().toISOString()}

View transaction: https://etherscan.io/tx/${transaction.transactionHash}`;
  }

  private async sendWebhookNotification(message: string): Promise<void> {
    if (!this.channels.webhook) return;
    
    try {
      await fetch(this.channels.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          username: 'Whale Monitor',
          icon_emoji: ':whale:',
        }),
      });
    } catch (error) {
      this.logger.error('Error sending webhook notification:', error);
    }
  }

  private async sendEmailNotification(message: string): Promise<void> {
    // Mock implementation - integrate with your email service
    this.logger.log('Email notification would be sent:', message);
  }
}
