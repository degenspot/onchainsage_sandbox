import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
    };
  }

  @Get('audit-log')
  async getAuditLog(@CurrentUser() user: any) {
    return this.auditService.getUserActions(user.id);
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  async getAllUsers() {
    // Only admins can view all users
    return { message: 'Admin endpoint - list all users' };
  }
}