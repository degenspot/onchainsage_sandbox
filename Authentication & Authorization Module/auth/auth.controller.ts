import { Controller, Post, Body, UseGuards, Get, Req, Patch, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './services/auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateReputationRuleDto } from './dto/create-reputation-rule.dto';
import { UpdateReputationRuleDto } from './dto/update-reputation-rule.dto';
import { ReputationService } from './services/reputation.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Position } from 'src/BVTE/entities/position.entity';

@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(Position)
    private readonly postRepo: Repository<Position>,
    private readonly authService: AuthService,
    private readonly reputationRuleRepo: ReputationService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent') || 'Unknown';
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  async refreshTokens(@Req() req: Request) {
    return this.authService.refreshTokens(req.user.sub, req.user.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: any) {
    return this.authService.logout(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };
  }

  @Post('auth/request-nonce')
  @ApiOperation({ summary: 'Get nonce for wallet login' })
  @ApiResponse({ status: 201, description: 'Nonce generated' })
  generateNonce(@Body() { walletAddress }: { walletAddress: string }) {
    return this.authService.generateNonce(walletAddress);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify signature and login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @Post('auth/verify')
  verifySignature(@Body() dto: { walletAddress: string; signature: string }) {
    return this.authService.verifyAndLogin(dto);
  }

  @Get('posts')
  getAllPosts() {
    return this.postRepo.find({ relations: ['author'] });
  }

  @Post('reputation-rule')
  createRule(@Body() dto: CreateReputationRuleDto) {
    return this.reputationRuleRepo.save(dto);
  }

  @Patch('reputation-rule/:id')
  updateRule(@Param('id') id: number, @Body() dto: UpdateReputationRuleDto) {
    return this.reputationRuleRepo.update(id, dto);
  }
}
