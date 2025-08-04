import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AchievementService } from '../services/achievement.service';
import { CreateAchievementDto } from '../dto/achievement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Nft } from '../entities/nft.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NftService } from '../services/nft.service';
import { NotFoundException } from '@nestjs/common';

@ApiTags('achievements')
@Controller('achievements')
export class AchievementController {
  constructor(
    private readonly achievementService: AchievementService,
    @InjectRepository(Nft)
    private readonly nftRepository: Repository<Nft>,
    private readonly nftService: NftService,
  ) {}

  @ApiOperation({ summary: 'Create new achievement' })
  @ApiResponse({ status: 201, description: 'Achievement created successfully' })
  @Post()
  @UseGuards(JwtAuthGuard)
  async createAchievement(@Body() createAchievementDto: CreateAchievementDto) {
    return this.achievementService.createAchievement(createAchievementDto);
  }

  @ApiOperation({ summary: 'Get all achievements' })
  @ApiResponse({ status: 200, description: 'List of all achievements' })
  @Get()
  async getAllAchievements() {
    return this.achievementService.getAllAchievements();
  }

  @ApiOperation({ summary: 'Get user achievements' })
  @ApiResponse({ status: 200, description: 'User achievements with progress' })
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserAchievements(@Param('userId') userId: string) {
    return this.achievementService.getUserAchievements(userId);
  }

  @ApiOperation({ summary: 'Get current user achievements' })
  @ApiResponse({ status: 200, description: 'Current user achievements' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMyAchievements(@Request() req) {
    return this.achievementService.getUserAchievements(req.user.id);
  }

  @ApiOperation({ summary: 'Get user points and stats' })
  @ApiResponse({ status: 200, description: 'User points and statistics' })
  @Get('points/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserPoints(@Param('userId') userId: string) {
    return this.achievementService.getUserPoints(userId);
  }

  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiResponse({ status: 200, description: 'Top users by points' })
  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit: number = 10) {
    return this.achievementService.getLeaderboard(limit);
  }

  @ApiOperation({ summary: 'Get all NFTs for a user' })
  @ApiResponse({ status: 200, description: 'List of user NFTs', type: [Nft] })
  @Get('nfts/user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserNfts(@Param('userId') userId: string) {
    return this.nftRepository.find({ where: { userId } });
  }

  @ApiOperation({ summary: 'Showcase an NFT on user profile' })
  @ApiResponse({ status: 200, description: 'NFT showcased' })
  @Post('nfts/:nftId/showcase')
  @UseGuards(JwtAuthGuard)
  async showcaseNft(@Param('nftId') nftId: string, @Request() req) {
    const nft = await this.nftRepository.findOne({ where: { id: nftId, userId: req.user.id } });
    if (!nft) throw new NotFoundException('NFT not found');
    nft.isShowcased = true;
    await this.nftRepository.save(nft);
    return { message: 'NFT showcased' };
  }

  @ApiOperation({ summary: 'Set an NFT for trade' })
  @ApiResponse({ status: 200, description: 'NFT set for trade' })
  @Post('nfts/:nftId/trade')
  @UseGuards(JwtAuthGuard)
  async setNftForTrade(@Param('nftId') nftId: string, @Request() req) {
    const nft = await this.nftRepository.findOne({ where: { id: nftId, userId: req.user.id } });
    if (!nft) throw new NotFoundException('NFT not found');
    nft.isForTrade = true;
    await this.nftRepository.save(nft);
    return { message: 'NFT set for trade' };
  }

  @ApiOperation({ summary: 'Transfer (trade) an NFT to another user' })
  @ApiResponse({ status: 200, description: 'NFT transferred' })
  @Post('nfts/:nftId/transfer/:toUserId')
  @UseGuards(JwtAuthGuard)
  async transferNft(@Param('nftId') nftId: string, @Param('toUserId') toUserId: string, @Request() req) {
    const nft = await this.nftRepository.findOne({ where: { id: nftId, userId: req.user.id } });
    if (!nft) throw new NotFoundException('NFT not found');
    // Optionally, call blockchain transfer here via NftService
    // await this.nftService.transferNft(nft.tokenId, toUserWalletAddress);
    nft.userId = toUserId;
    nft.isForTrade = false;
    nft.isShowcased = false;
    await this.nftRepository.save(nft);
    return { message: 'NFT transferred' };
  }

  @ApiOperation({ summary: 'Get all showcased NFTs (public)' })
  @ApiResponse({ status: 200, description: 'List of showcased NFTs', type: [Nft] })
  @Get('nfts/showcased/all')
  async getAllShowcasedNfts() {
    return this.nftRepository.find({ where: { isShowcased: true } });
  }
}