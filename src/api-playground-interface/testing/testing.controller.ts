import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TestingService } from './testing.service';
import { ExecuteRequestDto } from './dto/execute-request.dto';

@ApiTags('API Testing')
@Controller('testing')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Post('execute')
  @ApiOperation({ summary: 'Execute API request for testing' })
  @ApiResponse({ status: 200 })
  async executeRequest(@Body() executeRequestDto: ExecuteRequestDto) {
    return this.testingService.executeRequest(executeRequestDto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get test execution history' })
  @ApiResponse({ status: 200 })
  async getTestHistory() {
    return this.testingService.getTestHistory();
  }

  @Get('history/:id')
  @ApiOperation({ summary: 'Get specific test execution result' })
  @ApiResponse({ status: 200 })
  async getTestResult(@Param('id') id: string) {
    return this.testingService.getTestResult(id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate API request before execution' })
  @ApiResponse({ status: 200 })
  async validateRequest(@Body() executeRequestDto: ExecuteRequestDto) {
    return this.testingService.validateRequest(executeRequestDto);
  }
}