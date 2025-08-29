import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { TradingSignal } from '../interfaces/trading-signal.interface';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'trading-signals',
})
@Injectable()
export class NotificationService {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationService.name);
  private subscribedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of tokenAddresses

  @OnEvent('trading.signal-generated')
  async handleSignalGenerated(signal: TradingSignal): Promise<void> {
    try {
      // Send WebSocket notifications to subscribed users
      this.server.to(`token:${signal.tokenAddress}`).emit('new-signal', {
        tokenAddress: signal.tokenAddress,
        tokenSymbol: signal.tokenSymbol,
        signal: signal.signal,
        confidence: signal.confidence,
        price: signal.price,
        strength: signal.strength,
        reasoning: signal.reasoning,
        timestamp: signal.timestamp,
      });

      // Send strong signals to all users
      if (signal.signal.includes('STRONG')) {
        this.server.emit('strong-signal-alert', {
          tokenSymbol: signal.tokenSymbol,
          signal: signal.signal,
          confidence: signal.confidence,
          reasoning: signal.reasoning.slice(0, 2), // Top 2 reasons
        });
      }

      // Send email notifications for high-confidence signals
      if (signal.confidence > 80) {
        await this.sendEmailNotification(signal);
      }

      // Send webhook notifications
      await this.sendWebhookNotification(signal);

      this.logger.log(`Notifications sent for ${signal.signal} signal on ${signal.tokenSymbol}`);
    } catch (error) {
      this.logger.error('Failed to send notifications:', error);
    }
  }

  async subscribeToToken(userId: string, tokenAddress: string): Promise<void> {
    if (!this.subscribedUsers.has(userId)) {
      this.subscribedUsers.set(userId, new Set());
    }
    this.subscribedUsers.get(userId)!.add(tokenAddress);
    this.logger.log(`User ${userId} subscribed to ${tokenAddress}`);
  }

  async unsubscribeFromToken(userId: string, tokenAddress: string): Promise<void> {
    if (this.subscribedUsers.has(userId)) {
      this.subscribedUsers.get(userId)!.delete(tokenAddress);
    }
    this.logger.log(`User ${userId} unsubscribed from ${tokenAddress}`);
  }

  private async sendEmailNotification(signal: TradingSignal): Promise<void> {
    // Implementation would integrate with email service
    this.logger.log(`Email notification sent for ${signal.signal} on ${signal.tokenSymbol}`);
  }

  private async sendWebhookNotification(signal: TradingSignal): Promise<void> {
    // Implementation would send HTTP POST to configured webhook URLs
    this.logger.log(`Webhook notification sent for ${signal.signal} on ${signal.tokenSymbol}`);
  }
}