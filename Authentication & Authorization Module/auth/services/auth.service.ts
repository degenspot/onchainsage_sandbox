import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { TokenService } from './token.service';
import { AuditService } from '../../audit/audit.service';
import { LoginDto } from '../dto/login.dto';
import { verifyMessage } from 'ethers';
import { RegisterDto } from '../dto/register.dto';
import { comparePasswords, hashPassword } from '../../common/utils/bcrypt.utils';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { randomUUID } from 'crypto';
import { UsersService } from 'Authentication & Authorization Module/users/entities/users.service';

@Injectable()
export class AuthService {
  userRepo: any;
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = await this.usersService.create(registerDto);
    
    await this.auditService.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      details: { email: user.email, role: user.role },
    });

    const tokens = await this.generateTokens(user);
    return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await comparePasswords(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.auditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      details: { ipAddress, userAgent },
    });

    const tokens = await this.generateTokens(user);
    return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await comparePasswords(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = await this.generateTokens(user);
    
    await this.auditService.log({
      userId: user.id,
      action: 'TOKEN_REFRESHED',
      details: {},
    });

    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    
    await this.auditService.log({
      userId,
      action: 'USER_LOGOUT',
      details: {},
    });
  }

  private async generateTokens(user: any) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken({
      sub: user.id,
      email: user.email,
    });

    const hashedRefreshToken = await hashPassword(refreshToken);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return { accessToken, refreshToken };
  }

  private nonces = new Map<string, string>();

  generateNonce(walletAddress: string) {
    const nonce = randomUUID();
    this.nonces.set(walletAddress, nonce);
    return { nonce };
  }

  async verifyAndLogin({ walletAddress, signature }: any) {
    const nonce = this.nonces.get(walletAddress);
    const signer = verifyMessageWrapper(nonce, signature);
    if (signer.toLowerCase() !== walletAddress.toLowerCase()) throw new UnauthorizedException();

    let user = await this.userRepo.findOne({ where: { walletAddress } });
    if (!user) user = this.userRepo.create({ walletAddress });
    return this.userRepo.save(user);
  }
}

function verifyMessageWrapper(nonce: string | undefined, signature: any): string {
  if (!nonce || !signature) {
    throw new UnauthorizedException('Nonce or signature missing');
  }
  try {
    return verifyMessage(nonce, signature);
  } catch (error) {
    throw new UnauthorizedException('Invalid signature');
  }
}
