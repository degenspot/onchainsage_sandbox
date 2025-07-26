import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReputationService } from './reputation.service';

@Controller('reputation')
export class ReputationController {
  constructor(private reputationService: ReputationService) {}

  @Get('user/:id')
  getUserReputation(@Param('id') id: string) {
    return this.reputationService.getUserReputation(+id);
  }

  @Get('leaderboard')
  getLeaderboard(@Query('limit') limit?: string) {
    return this.reputationService.getLeaderboard(limit ? +limit : 10);
  }

  @Get('rules')
  getReputationRules() {
    return this.reputationService.getAllReputationRules();
  }
}