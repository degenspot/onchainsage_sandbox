import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  HttpCode, 
  HttpStatus,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TokenRiskService } from '../services/token-risk.service';
import { TokenAnalysisDto, BulkAnalysisDto } from '../dto/token-analysis.dto';
import { RiskAssessment } from '../interfaces/token-risk.interface';

@ApiTags('Token Risk Analysis')
@Controller('api/token-risk')
export class TokenRiskController {
  constructor(private readonly tokenRiskService: TokenRiskService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze single token for rug pull risks' })
  @ApiResponse({ status: 200, description: 'Risk assessment completed' })
  async analyzeToken(@Body() dto: TokenAnalysisDto): Promise<RiskAssessment> {
    return this.tokenRiskService.analyzeToken(dto.tokenAddress, dto.riskThreshold);
  }

  @Post('analyze/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze multiple tokens for rug pull risks' })
  @ApiResponse({ status: 200, description: 'Bulk risk assessment completed' })
  async analyzeBulkTokens(@Body() dto: BulkAnalysisDto): Promise<RiskAssessment[]> {
    return this.tokenRiskService.analyzeBulkTokens(dto.tokenAddresses, dto.riskThreshold);
  }

  @Get('history/:tokenAddress')
  @ApiOperation({ summary: 'Get risk assessment history for a token' })
  async getTokenRiskHistory(
    @Param('tokenAddress') tokenAddress: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.tokenRiskService.getTokenRiskHistory(tokenAddress, limit);
  }

  @Get('high-risk')
  @ApiOperation({ summary: 'Get tokens with high risk scores' })
  async getHighRiskTokens(
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    return this.tokenRiskService.getHighRiskTokens(limit);
  }
}
