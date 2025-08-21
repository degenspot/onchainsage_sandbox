import { 
  Controller, 
  Post, 
  Delete, 
  Get, 
  Param, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RealTimeMonitorService } from '../services/real-time-monitor.service';
import { BlockchainScannerService } from '../services/blockchain-scanner.service';

@ApiTags('Token Monitoring')
@Controller('api/monitoring')
export class MonitoringController {
  constructor(
    private readonly monitorService: RealTimeMonitorService,
    private readonly blockchainScanner: BlockchainScannerService,
  ) {}

  @Post('tokens/:tokenAddress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add token to real-time monitoring' })
  async addToMonitoring(@Param('tokenAddress') tokenAddress: string) {
    await this.monitorService.addTokenToMonitoring(tokenAddress);
    return { message: `Token ${tokenAddress} added to monitoring`, status: 'success' };
  }

  @Delete('tokens/:tokenAddress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove token from real-time monitoring' })
  async removeFromMonitoring(@Param('tokenAddress') tokenAddress: string) {
    await this.monitorService.removeTokenFromMonitoring(tokenAddress);
    return { message: `Token ${tokenAddress} removed from monitoring`, status: 'success' };
  }

  @Get('tokens')
  @ApiOperation({ summary: 'Get list of monitored tokens' })
  async getMonitoredTokens() {
    const tokens = this.monitorService.getMonitoredTokens();
    return { tokens, count: tokens.length };
  }

  @Get('scan/:tokenAddress')
  @ApiOperation({ summary: 'Scan token contract for suspicious events' })
  async scanContract(@Param('tokenAddress') tokenAddress: string) {
    const suspiciousEvents = await this.blockchainScanner.detectSuspiciousEvents(tokenAddress);
    return { 
      tokenAddress, 
      suspiciousEvents, 
      riskLevel: suspiciousEvents.length > 3 ? 'HIGH' : suspiciousEvents.length > 1 ? 'MEDIUM' : 'LOW' 
    };
  }
}
