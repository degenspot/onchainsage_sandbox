import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SignalTestService } from '../services/signal-test.service';
import { TestSignalDto } from '../dto/test-signal.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('signals/:signalId/tests')
@UseGuards(JwtAuthGuard)
export class SignalTestController {
  constructor(private readonly signalTestService: SignalTestService) {}

  @Post()
  createTest(
    @Param('signalId') signalId: string,
    @Body() testDto: TestSignalDto,
    @Request() req,
  ) {
    return this.signalTestService.createTest(signalId, testDto, req.user.id);
  }

  @Get()
  findTestsBySignal(@Param('signalId') signalId: string) {
    return this.signalTestService.findTestsBySignal(signalId);
  }

  @Get(':testId')
  findTest(@Param('testId') testId: string) {
    return this.signalTestService.findTest(testId);
  }
}