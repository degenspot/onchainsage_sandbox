import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;

  constructor() {
    // Initialize provider (this would be configured via environment variables)
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
  }

  async createMarketOnChain(marketData: any): Promise<string> {
    this.logger.log('Creating prediction market on blockchain...');
    
    // This would interact with a smart contract
    // For now, return a mock transaction hash
    return '0x' + Math.random().toString(16).substr(2, 64);
  }

  async stakeTokens(marketId: string, amount: number, userAddress: string): Promise<string> {
    this.logger.log(`Staking ${amount} tokens for market ${marketId} by ${userAddress}`);
    
    // This would interact with a smart contract to stake tokens
    // For now, return a mock transaction hash
    return '0x' + Math.random().toString(16).substr(2, 64);
  }

  async distributeWinnings(marketId: string, winners: any[]): Promise<string[]> {
    this.logger.log(`Distributing winnings for market ${marketId} to ${winners.length} winners`);
    
    // This would interact with a smart contract to distribute winnings
    // For now, return mock transaction hashes
    return winners.map(() => '0x' + Math.random().toString(16).substr(2, 64));
  }

  async getTokenBalance(userAddress: string, tokenAddress?: string): Promise<number> {
    try {
      if (tokenAddress) {
        // Get ERC-20 token balance
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)'],
          this.provider
        );
        const balance = await tokenContract.balanceOf(userAddress);
        return Number(ethers.formatEther(balance));
      } else {
        // Get native token balance (ETH, MATIC, etc.)
        const balance = await this.provider.getBalance(userAddress);
        return Number(ethers.formatEther(balance));
      }
    } catch (error) {
      this.logger.error(`Failed to get balance for ${userAddress}: ${error.message}`);
      return 0;
    }
  }

  async verifyTransaction(transactionHash: string): Promise<boolean> {
    try {
      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      return receipt && receipt.status === 1;
    } catch (error) {
      this.logger.error(`Failed to verify transaction ${transactionHash}: ${error.message}`);
      return false;
    }
  }

  async getCurrentBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      this.logger.error(`Failed to get current block number: ${error.message}`);
      return 0;
    }
  }

  async getGasPrice(): Promise<number> {
    try {
      const gasPrice = await this.provider.getFeeData();
      return Number(ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei'));
    } catch (error) {
      this.logger.error(`Failed to get gas price: ${error.message}`);
      return 0;
    }
  }

  async estimateGasForStake(amount: number): Promise<number> {
    // Mock gas estimation
    return 21000 + Math.floor(amount / 1000) * 1000;
  }

  async estimateGasForCreateMarket(): Promise<number> {
    // Mock gas estimation for market creation
    return 500000;
  }

  async estimateGasForDistributeWinnings(winnerCount: number): Promise<number> {
    // Mock gas estimation for winnings distribution
    return 100000 + (winnerCount * 50000);
  }
} 