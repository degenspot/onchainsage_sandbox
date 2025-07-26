import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';

@ApiTags('alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all alerts' })
  getAlerts(@Query('limit') limit: string = '50') {
    return this.alertsService.getAlerts(parseInt(limit));
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread alerts count' })
  getUnreadCount() {
    return this.alertsService.getUnreadCount();
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark alert as read' })
  markAsRead(@Param('id') id: string) {
    return this.alertsService.markAsRead(id);
  }
}
