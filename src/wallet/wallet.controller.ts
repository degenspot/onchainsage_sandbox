import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletHealthService } from './wallet-health.service';
import { ConnectWalletDto } from './dto/connect-wallet.dto';
import { WalletHealthResponseDto } from './dto/wallet-health-response.dto';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly walletHealthService: WalletHealthService,
  ) {}

  @Post('connect')
  async connectWallet(@Body() connectWalletDto: ConnectWalletDto) {
    return await this.walletService.connectWallet(connectWalletDto);
  }

  @Get(':address/health')
  async getWalletHealth(@Param('address') address: string): Promise<WalletHealthResponseDto> {
    return await this.walletHealthService.getWalletHealth(address);
  }

  @Get(':address/health/history')
  async getWalletHealthHistory(
    @Param('address') address: string,
    @Query('days') days: number = 30,
  ) {
    return await this.walletHealthService.getHealthHistory(address, days);
  }

  @Get(':address/alerts')
  async getWalletAlerts(@Param('address') address: string) {
    return await this.walletService.getWalletAlerts(address);
  }

  @Post(':address/alerts/:alertId/read')
  async markAlertAsRead(@Param('alertId') alertId: string) {
    return await this.walletService.markAlertAsRead(alertId);
  }
}
