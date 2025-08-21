import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { RiskAssessment } from '../interfaces/token-risk.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'token-risk',
})
@Injectable()
export class WebSocketAlertsService {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketAlertsService.name);
  private subscribedClients: Map<string, Set<string>> = new Map(); // tokenAddress -> Set of clientIds

  @SubscribeMessage('subscribe-token')
  handleSubscribeToken(client: Socket, @MessageBody() tokenAddress: string): void {
    const normalizedAddress = tokenAddress.toLowerCase();
    
    if (!this.subscribedClients.has(normalizedAddress)) {
      this.subscribedClients.set(normalizedAddress, new Set());
    }
    
    this.subscribedClients.get(normalizedAddress)!.add(client.id);
    client.join(`token:${normalizedAddress}`);
    
    this.logger.log(`Client ${client.id} subscribed to ${tokenAddress}`);
    client.emit('subscription-confirmed', { tokenAddress, status: 'subscribed' });
  }

  @SubscribeMessage('unsubscribe-token')
  handleUnsubscribeToken(client: Socket, @MessageBody() tokenAddress: string): void {
    const normalizedAddress = tokenAddress.toLowerCase();
    
    if (this.subscribedClients.has(normalizedAddress)) {
      this.subscribedClients.get(normalizedAddress)!.delete(client.id);
    }
    
    client.leave(`token:${normalizedAddress}`);
    this.logger.log(`Client ${client.id} unsubscribed from ${tokenAddress}`);
  }

  @OnEvent('token.high-risk-detected')
  handleHighRiskAlert(assessment: RiskAssessment): void {
    const tokenAddress = assessment.tokenAddress.toLowerCase();
    
    this.server.to(`token:${tokenAddress}`).emit('high-risk-alert', {
      tokenAddress: assessment.tokenAddress,
      riskScore: assessment.overallRiskScore,
      riskLevel: assessment.riskLevel,
      anomalies: assessment.anomalies,
      recommendation: assessment.recommendation,
      timestamp: assessment.timestamp,
    });

    this.logger.warn(`High risk alert sent to subscribers of ${assessment.tokenAddress}`);
  }

  @OnEvent('token.metrics-updated')
  handleMetricsUpdate(data: { tokenAddress: string; metrics: any; assessment: RiskAssessment }): void {
    const tokenAddress = data.tokenAddress.toLowerCase();
    
    this.server.to(`token:${tokenAddress}`).emit('metrics-update', {
      tokenAddress: data.tokenAddress,
      metrics: data.metrics,
      riskScore: data.assessment.overallRiskScore,
      riskLevel: data.assessment.riskLevel,
      timestamp: new Date(),
    });
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    // Clean up subscriptions
    this.subscribedClients.forEach((clients, tokenAddress) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.subscribedClients.delete(tokenAddress);
      }
    });
    
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}