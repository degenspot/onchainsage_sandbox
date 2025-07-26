import { Injectable, ForbiddenException } from '@nestjs/common';
import { ReputationService } from '../reputation/reputation.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { UpdateReputationRuleDto } from './dto/update-reputation-rule.dto';

@Injectable()
export class AdminService {
  constructor(
    private reputationService: ReputationService,
    private usersService: UsersService,
  ) {}

  private checkAdminPermission(user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
  }

  async updateReputationRule(id: number, updateDto: UpdateReputationRuleDto, admin: User) {
    this.checkAdminPermission(admin);
    return this.reputationService.updateReputationRule(id, updateDto.points);
  }

  async getAllUsers(admin: User) {
    this.checkAdminPermission(admin);
    return this.usersService.findAll();
  }

  async getSystemStats(admin: User) {
    this.checkAdminPermission(admin);
    const users = await this.usersService.findAll();
    const leaderboard = await this.reputationService.getLeaderboard(5);
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      topUsers: leaderboard,
    };
  }
}
