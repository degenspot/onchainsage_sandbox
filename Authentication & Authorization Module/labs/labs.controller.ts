import { Controller, Get, Post, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LabsFeatureGuard } from './guards/labs-feature.guard';
import { Permissions } from '../auth/decorators/roles.decorator';
import { Permission } from '../common/enums/permission.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LabsService } from './labs.service';

@Controller('labs')
@UseGuards(JwtAuthGuard, LabsFeatureGuard)
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Get('features')
  @Permissions(Permission.ACCESS_EXPERIMENTAL)
  async getExperimentalFeatures(@CurrentUser() user: any) {
    return this.labsService.getAvailableFeatures(user);
  }

  @Post('features/enable')
  @Permissions(Permission.WRITE_LABS)
  async enableFeature(@Body('featureName') featureName: string, @CurrentUser() user: any) {
    return this.labsService.enableFeature(featureName, user);
  }

  @Get('experiments')
  @Permissions(Permission.ACCESS_EXPERIMENTAL)
  async getExperiments(@CurrentUser() user: any) {
    return this.labsService.getUserExperiments(user);
  }
}