import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { RiskAlert } from './entities/risk-alert.entity';
import { ConnectWalletDto } from './dto/connect-wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(RiskAlert)
    private riskAlertRepository: Repository<RiskAlert>,
  ) {}

  async connectWallet(connectWalletDto: ConnectWalletDto): Promise<Wallet> {
    const { address, userId } = connectWalletDto;
    
    // Check if wallet already exists
    let wallet = await this.walletRepository.findOne({ where: { address } });
    
    if (!wallet) {
      wallet = this.walletRepository.create({
        address,
        userId,
      });
      await this.walletRepository.save(wallet);
    }

    return wallet;
  }

  async getWalletByAddress(address: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({ 
      where: { address },
      relations: ['healthHistory', 'riskAlerts']
    });
    
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    
    return wallet;
  }

  async getWalletAlerts(address: string) {
    const wallet = await this.getWalletByAddress(address);
    
    return await this.riskAlertRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
    });
  }

  async markAlertAsRead(alertId: string) {
    return await this.riskAlertRepository.update(alertId, { isRead: true });
  }
}