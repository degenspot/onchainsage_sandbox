import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WhaleWallet } from './entities/whale-wallet.entity';
import { WhaleTransaction, TransactionType } from './entities/whale-transaction.entity';
import { BlockchainService } from './blockchain.service';
import { NotificationService } from './notification.service';
import { WhaleMonitoringGateway } from './whale-monitoring.gateway';

export interface WhaleDetectionConfig {
  minBalanceThreshold: number;
  minTransactionThreshold: number;
  volumeMultiplier: number;
  timeWindowHours: number;
}

export interface WhaleMovement {
  wallet: WhaleWallet;
  transaction: WhaleTransaction;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

@Injectable()
export class WhaleMonitoringService {
  private readonly logger = new Logger(WhaleMonitoringService.name);
  private readonly config: WhaleDetectionConfig = {
    minBalanceThreshold: 1000, // ETH or equivalent
    minTransactionThreshold: 100, // ETH or equivalent
    volumeMultiplier: 2.5,
    timeWindowHours: 24,
  };

  constructor(
    @InjectRepository(WhaleWallet)
    private whaleWalletRepository: Repository<WhaleWallet>,
    @InjectRepository(WhaleTransaction)
    private whaleTransactionRepository: Repository<WhaleTransaction>,
    private blockchainService: BlockchainService,
    private notificationService: NotificationService,
    private whaleGateway: WhaleMonitoringGateway,
  ) {}

  async detectWhaleWallet(address: string, balance: number, volume: number): Promise<boolean> {
    const isWhale = 
      balance >= this.config.minBalanceThreshold ||
      volume >= this.config.minBalanceThreshold * this.config.volumeMultiplier;
    
    if (isWhale) {
      await this.addOrUpdateWhaleWallet(address, balance, volume);
    }
    
    return isWhale;
  }

  private async addOrUpdateWhaleWallet(address: string, balance: number, volume: number): Promise<WhaleWallet> {
    let whale = await this.whaleWalletRepository.findOne({ where: { address } });
    
    if (!whale) {
      whale = this.whaleWalletRepository.create({
        address,
        balance,
        totalVolume: volume,
        impactScore: this.calculateImpactScore(balance, volume),
        lastActivity: new Date(),
      });
    } else {
      whale.balance = balance;
      whale.totalVolume += volume;
      whale.impactScore = this.calculateImpactScore(balance, whale.totalVolume);
      whale.lastActivity = new Date();
    }
    
    return await this.whaleWalletRepository.save(whale);
  }

  private calculateImpactScore(balance: number, volume: number): number {
    const balanceScore = Math.log10(balance / this.config.minBalanceThreshold + 1) * 30;
    const volumeScore = Math.log10(volume / this.config.minBalanceThreshold + 1) * 20;
    return Math.min(balanceScore + volumeScore, 100);
  }

  async processTransaction(txData: any): Promise<void> {
    const { hash, from, to, value, blockNumber, gasPrice, gasUsed } = txData;
    const amount = parseFloat(value);
    
    if (amount < this.config.minTransactionThreshold) return;

    // Check if sender or receiver is a whale
    const fromBalance = await this.blockchainService.getWalletBalance(from);
    const toBalance = await this.blockchainService.getWalletBalance(to);
    
    const isFromWhale = await this.detectWhaleWallet(from, fromBalance, amount);
    const isToWhale = await this.detectWhaleWallet(to, toBalance, amount);
    
    if (isFromWhale || isToWhale) {
      await this.recordWhaleTransaction({
        transactionHash: hash,
        blockNumber,
        fromAddress: from,
        toAddress: to,
        amount,
        gasPrice: parseFloat(gasPrice),
        gasUsed: parseInt(gasUsed),
      });
    }
  }

  private async recordWhaleTransaction(txData: any): Promise<void> {
    const { fromAddress, toAddress, amount } = txData;
    
    // Record outgoing transaction for sender whale
    const fromWhale = await this.whaleWalletRepository.findOne({ where: { address: fromAddress } });
    if (fromWhale) {
      const outgoingTx = this.whaleTransactionRepository.create({
        ...txData,
        type: TransactionType.OUTGOING,
        impactScore: this.calculateTransactionImpact(amount, fromWhale.balance),
        wallet: fromWhale,
      });
      await this.whaleTransactionRepository.save(outgoingTx);
      
      const movement: WhaleMovement = {
        wallet: fromWhale,
        transaction: outgoingTx,
        impactLevel: this.getImpactLevel(outgoingTx.impactScore),
        timestamp: new Date(),
      };
      
      await this.handleWhaleMovement(movement);
    }
    
    // Record incoming transaction for receiver whale
    const toWhale = await this.whaleWalletRepository.findOne({ where: { address: toAddress } });
    if (toWhale) {
      const incomingTx = this.whaleTransactionRepository.create({
        ...txData,
        type: TransactionType.INCOMING,
        impactScore: this.calculateTransactionImpact(amount, toWhale.balance),
        wallet: toWhale,
      });
      await this.whaleTransactionRepository.save(incomingTx);
      
      const movement: WhaleMovement = {
        wallet: toWhale,
        transaction: incomingTx,
        impactLevel: this.getImpactLevel(incomingTx.impactScore),
        timestamp: new Date(),
      };
      
      await this.handleWhaleMovement(movement);
    }
  }

  private calculateTransactionImpact(amount: number, walletBalance: number): number {
    const percentageOfBalance = (amount / walletBalance) * 100;
    const amountScore = Math.log10(amount / this.config.minTransactionThreshold + 1) * 25;
    const percentageScore = Math.min(percentageOfBalance, 50);
    return Math.min(amountScore + percentageScore, 100);
  }

  private getImpactLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private async handleWhaleMovement(movement: WhaleMovement): Promise<void> {
    this.logger.log(`Whale movement detected: ${movement.impactLevel} impact from ${movement.wallet.address}`);
    
    // Send real-time WebSocket notification
    this.whaleGateway.broadcastWhaleMovement(movement);
    
    // Send push notifications for high-impact movements
    if (['high', 'critical'].includes(movement.impactLevel)) {
      await this.notificationService.sendWhaleAlert(movement);
    }
    
    // Update wallet statistics
    await this.updateWalletStats(movement.wallet);
  }

  private async updateWalletStats(whale: WhaleWallet): Promise<void> {
    const transactionCount = await this.whaleTransactionRepository.count({
      where: { wallet: { id: whale.id } },
    });
    
    whale.transactionCount = transactionCount;
    whale.lastActivity = new Date();
    await this.whaleWalletRepository.save(whale);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async monitorRealtimeTransactions(): Promise<void> {
    try {
      const latestTransactions = await this.blockchainService.getLatestTransactions();
      
      for (const tx of latestTransactions) {
        await this.processTransaction(tx);
      }
    } catch (error) {
      this.logger.error('Error monitoring real-time transactions:', error);
    }
  }

  async getWhaleWallets(limit = 50, offset = 0): Promise<WhaleWallet[]> {
    return await this.whaleWalletRepository.find({
      where: { isActive: true },
      order: { impactScore: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['transactions'],
    });
  }

  async getWhaleActivity(walletId: string, days = 7): Promise<WhaleTransaction[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await this.whaleTransactionRepository.find({
      where: {
        wallet: { id: walletId },
        createdAt: MoreThan(startDate),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getHistoricalWhaleAnalysis(days = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const transactions = await this.whaleTransactionRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.wallet', 'wallet')
      .where('tx.createdAt >= :startDate', { startDate })
      .orderBy('tx.createdAt', 'DESC')
      .getMany();
    
    const analysis = {
      totalTransactions: transactions.length,
      totalVolume: transactions.reduce((sum, tx) => sum + Number(tx.amount), 0),
      averageTransactionSize: 0,
      topWhales: [],
      dailyActivity: [],
      impactDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
    };
    
    analysis.averageTransactionSize = analysis.totalVolume / analysis.totalTransactions;
    
    // Calculate impact distribution
    transactions.forEach(tx => {
      const level = this.getImpactLevel(tx.impactScore);
      analysis.impactDistribution[level]++;
    });
    
    // Get top whales by activity
    const whaleActivity = new Map();
    transactions.forEach(tx => {
      const address = tx.wallet.address;
      if (!whaleActivity.has(address)) {
        whaleActivity.set(address, {
          wallet: tx.wallet,
          transactionCount: 0,
          totalVolume: 0,
        });
      }
      const stats = whaleActivity.get(address);
      stats.transactionCount++;
      stats.totalVolume += Number(tx.amount);
    });
    
    analysis.topWhales = Array.from(whaleActivity.values())
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 10);
    
    return analysis;
  }
}
