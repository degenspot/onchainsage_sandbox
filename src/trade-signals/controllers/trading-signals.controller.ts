import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  HttpCode, 
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignalGeneratorService } from '../services/signal-generator.service';
import { BacktestService } from '../services/backtest.service';
import { SignalParametersService } from '../services/signal-parameters.service';
import { CreateSignalParametersDto, BacktestRequestDto } from '../dto/signal-parameters.dto';

@ApiTags('Trading Signals')
@Controller('api/trading-signals')
export class TradingSignalsController {
  constructor(
    private readonly signalGenerator: SignalGeneratorService,
    private readonly backtestService: BacktestService,
    private readonly parametersService: SignalParametersService,
  ) {}

  @Post('generate/:tokenAddress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate trading signal for a token' })
  @ApiResponse({ status: 200, description: 'Trading signal generated successfully' })
  async generateSignal(
    @Param('tokenAddress') tokenAddress: string,
    @Query('tokenSymbol') tokenSymbol: string,
    @Query('parametersId') parametersId: string,
  ) {
    return this.signalGenerator.generateSignal(tokenAddress, tokenSymbol, parametersId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active trading signals' })
  async getActiveSignals(
    @Query('tokenAddress') tokenAddress?: string,
    @Query('signal') signal?: string,
  ) {
    return this.signalGenerator.getActiveSignals(tokenAddress, signal);
  }

  @Get('history/:tokenAddress')
  @ApiOperation({ summary: 'Get signal history for a token' })
  async getSignalHistory(
    @Param('tokenAddress') tokenAddress: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    return this.signalGenerator.getSignalHistory(tokenAddress, limit);
  }

  @Post('parameters')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new signal parameters' })
  async createParameters(@Body() dto: CreateSignalParametersDto) {
    return this.parametersService.createParameters(dto);
  }

  @Get('parameters')
  @ApiOperation({ summary: 'Get all signal parameters' })
  async getParameters() {
    return this.parametersService.getAllParameters();
  }

  @Post('backtest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run backtest for signal parameters' })
  async runBacktest(@Body() dto: BacktestRequestDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    return this.backtestService.runBacktest(
      dto.parameterSetId,
      startDate,
      endDate,
      dto.tokenAddresses
    );
  }

  @Get('backtest/results')
  @ApiOperation({ summary: 'Get backtest results' })
  async getBacktestResults(@Query('parametersId') parametersId?: string) {
    return this.backtestService.getBacktestResults(parametersId);
  }
}
