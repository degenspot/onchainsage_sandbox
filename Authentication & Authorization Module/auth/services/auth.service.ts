import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { TokenService } from './token.service';
import { AuditService } from '../../audit/audit.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { comparePasswords, hashPassword } from '../../common/utils/bcrypt.utils';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
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
}