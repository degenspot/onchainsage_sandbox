import { Controller, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateReputationRuleDto } from './dto/update-reputation-rule.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Put('reputation-rules/:id')
  updateReputationRule(
    @Param('id') id: string,
    @Body() updateDto: UpdateReputationRuleDto,
    @Request() req,
  ) {
    return this.adminService.updateReputationRule(+id, updateDto, req.user);
  }

  @Get('users')
  getAllUsers(@Request() req) {
    return this.adminService.getAllUsers(req.user);
  }

  @Get('stats')
  getSystemStats(@Request() req) {
    return this.adminService.getSystemStats(req.user);
  }
}
