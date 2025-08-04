import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomAlertsService } from './custom-alerts.service';
import { CreateAlertDto, UpdateAlertDto, AlertStatusDto } from './dto';
import { AlertPerformanceDto } from './dto/update-alert.dto';
import { CustomAlert } from './entities/custom-alert.entity';
import { AlertHistory } from './entities/alert-history.entity';
import { AlertConfiguration } from './entities/alert-configuration.entity';

// TODO: Import actual auth guard
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Custom Alerts')
@Controller('custom-alerts')
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth()
export class CustomAlertsController {
  constructor(private readonly customAlertsService: CustomAlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new custom alert' })
  @ApiResponse({ status: 201, description: 'Alert created successfully', type: CustomAlert })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createAlert(
    @Request() req: any,
    @Body() createAlertDto: CreateAlertDto,
  ): Promise<CustomAlert> {
    const userId = req.user?.id || 'test-user'; // TODO: Get from actual auth
    return this.customAlertsService.createAlert(userId, createAlertDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user alerts' })
  @ApiResponse({ status: 200, description: 'List of user alerts', type: [CustomAlert] })
  async getUserAlerts(
    @Request() req: any,
    @Query('status') status?: string,
  ): Promise<CustomAlert[]> {
    const userId = req.user?.id || 'test-user'; // TODO: Get from actual auth
    return this.customAlertsService.getUserAlerts(userId, status as any);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get alert statistics for user' })
  @ApiResponse({ status: 200, description: 'Alert statistics' })
  async getAlertStatistics(@Request() req: any): Promise<any> {
    const userId = req.user?.id || 'test-user'; // TODO: Get from actual auth
    return this.customAlertsService.getAlertStatistics(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID' })
  @ApiResponse({ status: 200, description: 'Alert details', type: CustomAlert })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async getAlert(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<CustomAlert> {
    const userId = req.user?.id || 'test-user'; // TODO: Get from actual auth
    return this.customAlertsService.getAlertById(userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update alert' })
  @ApiResponse({ status: 200, description: 'Alert updated successfully', type: CustomAlert })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async updateAlert(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateAlertDto: UpdateAlertDto,
  ): Promise<CustomAlert> {
    const userId = req.user?.id || 'test-user'; // TODO: Get from actual auth
    return this.customAlertsService.updateAlert(userId, id, updateAlertDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete alert' })
  @ApiResponse({ status: 204, description: 'Alert deleted successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async deleteAlert(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = req.user?.id || 'test-user'; // TODO: Get from actual auth
    return this.customAlertsService.deleteAlert(userId, id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Toggle alert status' })
  @ApiResponse({ status: 200, description: 'Alert status updated', type: CustomAlert })
  async toggleAlertStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() statusDto: AlertStatusDto,
  ): Promise<CustomAlert> {
    const userId = req.user?.id || 'test-user'; // TODO: Get from actual auth
    const enabled = statusDto.status === 'active';
    return this.customAlertsService.toggleAlertStatus(userId, id, enabled);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get alert history' })
  @ApiResponse({ status: 200, description: 'Alert history', type: [AlertHistory] })
  async getAlertHistory(
    @Request() req: any,
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ): Promise<AlertHistory[]> {
    const userId = req.user?.id || 'test-user'; // TODO: Get from actual auth
    return this.customAlertsService.getAlertHistory(userId, id, limit);
  }

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get alert performance metrics' })
  @ApiResponse({ status: 200, description: 'Alert performance', type: AlertPerformanceDto })
  async getAlertPerformance(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<AlertPerformanceDto> {
    const userId = req.user?.id || 'test-user'; // TODO: Get from actual auth
    return this.customAlertsService.getAlertPerformance(userId, id);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share alert configuration' })
  @ApiResponse({ status: 200, description: 'Alert shared successfully' })
  async shareAlert(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<{ sharedId: string }> {
    const userId = req.user?.id || 'test-user'; // TODO: Get from actual auth
    return this.customAlertsService.shareAlert(userId, id);
  }

  @Post('import/:sharedId')
  @ApiOperation({ summary: 'Import shared alert configuration' })
  @ApiResponse({ status: 201, description: 'Alert imported successfully', type: CustomAlert })
  async importSharedAlert(
    @Request() req: any,
    @Param('sharedId') sharedId: string,
    @Body() body: { name?: string },
  ): Promise<CustomAlert> {
    const userId = req.user?.id || 'test-user'; // TODO: Get from actual auth
    return this.customAlertsService.importSharedAlert(userId, sharedId, body.name);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export alert configuration' })
  @ApiResponse({ status: 200, description: 'Alert configuration exported' })
  async exportAlertConfiguration(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<any> {
    const userId = req.user?.id || 'test-user'; // TODO: Get from actual auth
    return this.customAlertsService.exportAlertConfiguration(userId, id);
  }

  @Get('templates/public')
  @ApiOperation({ summary: 'Get public alert templates' })
  @ApiResponse({ status: 200, description: 'Public alert templates', type: [AlertConfiguration] })
  async getPublicTemplates(
    @Query('category') category?: string,
  ): Promise<AlertConfiguration[]> {
    return this.customAlertsService.getPublicAlertConfigurations(category);
  }

  @Post('templates/:templateId/create')
  @ApiOperation({ summary: 'Create alert from template' })
  @ApiResponse({ status: 201, description: 'Alert created from template', type: CustomAlert })
  async createFromTemplate(
    @Request() req: any,
    @Param('templateId') templateId: string,
    @Body() customizations: any,
  ): Promise<CustomAlert> {
    const userId = req.user?.id || 'test-user'; // TODO: Get from actual auth
    return this.customAlertsService.createAlertFromTemplate(userId, templateId, customizations);
  }

  @Get('history/all')
  @ApiOperation({ summary: 'Get all alert history for user' })
  @ApiResponse({ status: 200, description: 'All alert history', type: [AlertHistory] })
  async getAllAlertHistory(
    @Request() req: any,
    @Query('limit') limit?: number,
  ): Promise<AlertHistory[]> {
    const userId = req.user?.id || 'test-user'; // TODO: Get from actual auth
    return this.customAlertsService.getAlertHistory(userId, undefined, limit);
  }
} 