import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ChallengeService } from './providers/challenge.service';
import { ChallengeParticipantService } from './providers/challenge-participant-service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { Challenge } from './entities/challenge.entity';

@ApiTags('Challenges')
@Controller('challenges')
export class ChallengeController {
  constructor(
    private readonly challengeService: ChallengeService,
    private readonly participantService: ChallengeParticipantService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Admin: Create a new challenge' })
  @ApiResponse({
    status: 201,
    description: 'Challenge created successfully',
    type: Challenge,
  })
  @ApiBody({ type: CreateChallengeDto })
  createChallenge(@Body() dto: CreateChallengeDto) {
    return this.challengeService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all challenges' })
  @ApiResponse({
    status: 200,
    description: 'List of all challenges',
    type: [Challenge],
  })
  getAllChallenges() {
    return this.challengeService.findAll();
  }

  @Post(':id/join/:userId')
  @ApiOperation({ summary: 'User: Join a challenge' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 201,
    description: 'User successfully joined the challenge',
  })
  join(@Param('id') challengeId: string, @Param('userId') userId: string) {
    return this.participantService.joinChallenge(userId, challengeId);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get the leaderboard of a challenge' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard fetched successfully'
  })
  leaderboard(@Param('id') id: string) {
    return this.participantService.getLeaderboard(id);
  }
}