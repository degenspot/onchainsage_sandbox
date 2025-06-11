import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WhaleMonitoringService } from './whale-monitoring.service';
import { WhaleWallet } from './entities/whale-wallet.entity';
import { WhaleTransaction } from './entities/whale-transaction.entity';

@ApiTags('whale-monitoring')
@Controller('whale-monitoring')
export class WhaleMonitoringController {
  constructor(private readonly whaleMonitoringService: WhaleMonitoringService) {}

  @Get('whales')
  @ApiOperation({ summary: 'Get list of whale wallets' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of whale wallets', type: [WhaleWallet] })
  async getWhales(
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ): Promise<WhaleWallet[]> {
    return await this.whaleMonitoringService.getWhaleWallets(limit, offset);
  }

  @Get('whales/:id/activity')
  @ApiOperation({ summary: 'Get whale activity history' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Whale transaction history', type: [WhaleTransaction] })
  async getWhaleActivity(
    @Param('id') walletId: string,
    @Query('days') days = 7,
  ): Promise<WhaleTransaction[]> {
    return await this.whaleMonitoringService.getWhaleActivity(walletId, days);
  }

  @Get('analytics/historical')
  @ApiOperation({ summary: 'Get historical whale analysis' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Historical whale analytics' })
  async getHistoricalAnalysis(@Query('days') days = 30) {
    return await this.whaleMonitoringService.getHistoricalWhaleAnalysis(days);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for whale monitoring service' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'whale-monitoring',
      version: '1.0.0',
    };
  }
}
