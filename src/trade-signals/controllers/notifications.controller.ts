import { 
  Controller, 
  Post, 
  Delete, 
  Body, 
  Param, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';

class SubscriptionDto {
  userId: string;
  tokenAddress: string;
}

@ApiTags('Signal Notifications')
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to trading signals for a token' })
  async subscribeToToken(@Body() dto: SubscriptionDto) {
    await this.notificationService.subscribeToToken(dto.userId, dto.tokenAddress);
    return { message: 'Successfully subscribed to token signals' };
  }

  @Delete('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from trading signals for a token' })
  async unsubscribeFromToken(@Body() dto: SubscriptionDto) {
    await this.notificationService.unsubscribeFromToken(dto.userId, dto.tokenAddress);
    return { message: 'Successfully unsubscribed from token signals' };
  }
}